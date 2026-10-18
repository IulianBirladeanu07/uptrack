import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    ActivityIndicator, Platform, Vibration, Animated, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { AuthContext } from '../../../auth/context/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import {
    validateWeight,
    loadUserWeightData,
    handleSaveLogic,
    processWeightInsForDisplay,
    adjustWeight,
    getRollingAverageWeight,
    getLocalWeekStart,
} from '../../helpers/weightTrackerUtils';
import type { ChartEntry } from './WeightChart';
import { isSuspiciousWeightEntry, getCurrentTrendWeight } from '../../../profile/utils/weightTrendEngine';
import { useFoodContext } from '../../context/FoodContext';
import { formatDate as formatDateKey } from '../../utils/dateUtils';
import { useAppNavigation } from '../../../../shared/navigation';
import type { Numeric, PlanType, WeightInWeek } from '../../../../shared/types';
import {
    WEEK_DAYS,
    getWeightGoalProgressPercent,
    getWeightGoalRemaining,
    isComparisonInCurrentGoalPhase,
    isWeightGoalReached,
} from './weightTrackerPresentation';
import { applyWeightKey } from './weightInput';
import WeightEntryModal from './WeightEntryModal';
import WeightSummaryCard from './WeightSummaryCard';
import WeightProgressPanel from './WeightProgressPanel';

const DAY_LABELS         = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATE_OPTIONS_COUNT = 7;

const toNum = (v: Numeric | null | undefined): number | null => (v == null ? null : Number(v));

const buildDateOptions = () =>
    Array.from({ length: DATE_OPTIONS_COUNT }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
    });

const serializeWeightIns = (weightIns: WeightInWeek[] | null | undefined) =>
    (weightIns || []).map(w => ({
        ...w,
        days: w.days
            ? Object.fromEntries(
                Object.entries(w.days).map(([k, v]) => [k, v])
              )
            : {},
    }));


const WeightTracker = () => {
    const navigation  = useAppNavigation();
    const insets      = useSafeAreaInsets();
    const { getMealCache } = useFoodContext();
    const { userData, refreshUserData } = useContext(AuthContext)!;

    const [userId,         setUserId]         = useState<string | null>(null);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [modalVisible,   setModalVisible]   = useState(false);
    const [weightInput, setWeightInput] = useState('');
    const [isValid,     setIsValid]     = useState(true);
    const [isSelected,  setIsSelected]  = useState(false);

    const [committedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [modalDate, setModalDate] = useState(committedDate);

    const [currentWeight,   setCurrentWeight]   = useState<number | null>(null);
    const [weeklyData,      setWeeklyData]      = useState<WeightInWeek | undefined>(undefined);
    const [weeklyAverage,   setWeeklyAverage]   = useState<number | null>(null);
    const [lastWeekAverage, setLastWeekAverage] = useState<number | null>(null);
    const [trendData,       setTrendData]       = useState<ChartEntry[]>([]);
    const [weightIns,       setWeightIns]       = useState<WeightInWeek[]>([]);
    const [startWeight,     setStartWeight]     = useState<number | null>(null);
    const [goalWeight,      setGoalWeight]      = useState<number | null>(null);
    const [goalSwitchDate,  setGoalSwitchDate]  = useState<string | null>(null);

    const longPressTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const freshEntryRef     = useRef(true);
    const cursorOpacity     = useRef(new Animated.Value(1)).current;
    const dateOptions       = useMemo(() => buildDateOptions(), []);

    const planType      = userData?.weightChangePlan?.type ?? null;
    const fallbackBulk  = goalWeight != null && startWeight != null && goalWeight > startWeight;
    const effectivePlanType: PlanType = planType ?? (fallbackBulk ? 'muscle_gain' : 'weight_loss');
    const isBulking     = effectivePlanType === 'muscle_gain';
    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        await loadUserWeightData(
            userId, committedDate,
            v => setCurrentWeight(toNum(v)), setWeightInput, setWeeklyData,
            setWeeklyAverage, setLastWeekAverage, setTrendData,
            setWeightIns, v => setStartWeight(toNum(v)), v => setGoalWeight(toNum(v)),
            setGoalSwitchDate,
        );
        setLoading(false);
    }, [userId, committedDate]);

    useEffect(() => {
        const user = getAuth().currentUser;
        if (user) setUserId(user.uid);
        else      setLoading(false);
    }, []);

    useEffect(() => { if (userId) loadData(); }, [userId, loadData]);

    useEffect(() => {
        if (isSelected || !modalVisible) {
            cursorOpacity.setValue(1);
            return undefined;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isSelected, modalVisible, cursorOpacity]);

    const allEntries = useMemo(() => processWeightInsForDisplay(weightIns, 60), [weightIns]);

    const thisWeekDays = useMemo(() =>
        DAY_LABELS.map((label, i) => ({
            key:    WEEK_DAYS[i],
            label,
            logged: weeklyData?.days?.[WEEK_DAYS[i]] != null,
        })),
    [weeklyData]);

    const loggedCount = thisWeekDays.filter(d => d.logged).length;

    const rollingAverageWeight = useMemo(() => getRollingAverageWeight(weightIns, 7), [weightIns]);
    const progressWeight = rollingAverageWeight ?? currentWeight;

    const progressPercent = useMemo(
        () => getWeightGoalProgressPercent(progressWeight, startWeight, goalWeight),
        [progressWeight, startWeight, goalWeight],
    );

    const remaining = getWeightGoalRemaining(progressWeight, goalWeight, effectivePlanType);
    const goalReached = isWeightGoalReached(progressWeight, goalWeight, effectivePlanType);
    const summaryWeekStart = weeklyData?.weekStart ?? getLocalWeekStart(committedDate);
    const previousSummaryWeekStart = weightIns
        .filter(week => week.weekStart < summaryWeekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]?.weekStart;
    const summaryTrendPhaseKnown = isComparisonInCurrentGoalPhase(
        summaryWeekStart,
        previousSummaryWeekStart,
        goalSwitchDate,
    );

    const handleKeypadPress = (key: string) => {
        if (Platform.OS === 'ios') Vibration.vibrate(5);

        const isFresh = freshEntryRef.current;
        freshEntryRef.current = false;
        setIsSelected(false);

        const next = applyWeightKey(weightInput, key, isFresh);
        if (next == null) return;
        setWeightInput(next);
        setIsValid(next !== '' && validateWeight(next));
    };

    const doAdjust = useCallback((delta: number) => {
        if (Platform.OS === 'ios') Vibration.vibrate(10);
        freshEntryRef.current = false;
        setIsSelected(false);
        setWeightInput(prev => adjustWeight(prev, delta));
        setIsValid(true);
    }, []);

    const startLongPress = useCallback((delta: number) => {
        longPressTimer.current = setTimeout(() => {
            longPressInterval.current = setInterval(() => doAdjust(delta), 80);
        }, 400);
    }, [doAdjust]);

    const stopLongPress = useCallback(() => {
        clearTimeout(longPressTimer.current);
        clearInterval(longPressInterval.current);
        longPressTimer.current = undefined;
        longPressInterval.current = undefined;
    }, []);

    useEffect(() => stopLongPress, [stopLongPress]);

    const selectDate = useCallback((d: Date) => {
        setModalDate(d);
        const key   = formatDateKey(d);
        const entry = allEntries.find(e => e.dateKey === key);
        if (entry) {
            setWeightInput(entry.weight.toFixed(1));
            setIsValid(true);
        } else {
            setWeightInput('');
            setIsValid(false);
        }
        freshEntryRef.current = true;
        setIsSelected(true);
    }, [allEntries]);

    const commitWeightSave = async (parsedWeight: number) => {
        if (!userId) return;
        setSaving(true);
        try {
            await handleSaveLogic(
                userId, parsedWeight, modalDate,
                setCurrentWeight, setWeeklyAverage, loadData,
                getMealCache(),
            );
            await refreshUserData();
            setModalVisible(false);
        } catch (e) {
            console.error('handleSave:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!validateWeight(weightInput)) return;

        const parsedWeight = parseFloat(weightInput);
        const currentTrendWeight = getCurrentTrendWeight(weightIns);

        if (currentTrendWeight != null && isSuspiciousWeightEntry(parsedWeight, currentTrendWeight)) {
            Alert.alert(
                'Double-check this entry',
                `${parsedWeight}kg is a big jump from your recent trend (${currentTrendWeight.toFixed(1)}kg). Save anyway?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save Anyway', style: 'destructive', onPress: () => commitWeightSave(parsedWeight) },
                ]
            );
            return;
        }

        await commitWeightSave(parsedWeight);
    };

    const openModal = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setModalDate(today);
        if (allEntries[0]) {
            setWeightInput(allEntries[0].weight.toFixed(1));
            setIsValid(true);
        } else {
            setWeightInput('');
            setIsValid(false);
        }
        freshEntryRef.current = true;
        setIsSelected(true);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsSelected(false);
    };

    if (loading) return (
        <SafeAreaView style={styles.loadingScreen} edges={['top', 'bottom']}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <WeightSummaryCard
                    currentWeight={currentWeight}
                    loggedCount={loggedCount}
                    startWeight={startWeight}
                    goalWeight={goalWeight}
                    progressPercent={progressPercent}
                    lastWeekAverage={lastWeekAverage}
                    weeklyAverage={weeklyAverage}
                    remaining={remaining}
                    planType={effectivePlanType}
                    goalReached={goalReached}
                    trendPhaseKnown={summaryTrendPhaseKnown}
                />

                <WeightProgressPanel
                    trendData={trendData}
                    goalSwitchDate={goalSwitchDate}
                    startWeight={startWeight}
                    weightIns={weightIns}
                    isBulking={isBulking}
                    planType={effectivePlanType}
                    onViewAll={() => navigation.navigate('WeightHistory', {
                        weightIns: serializeWeightIns(weightIns),
                        planType: effectivePlanType,
                        startWeight,
                        goalWeight,
                        goalSwitchDate,
                    })}
                />
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[3] }]}>
                <TouchableOpacity style={styles.logButton} onPress={openModal} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.accent.buttonText} />
                    <Text style={styles.logButtonText}>Log Weight</Text>
                </TouchableOpacity>
            </View>

            <WeightEntryModal
                visible={modalVisible}
                bottomInset={insets.bottom}
                modalDate={modalDate}
                dateOptions={dateOptions}
                entries={allEntries}
                selected={isSelected}
                weightInput={weightInput}
                isValid={isValid}
                saving={saving}
                onClose={closeModal}
                onSelectDate={selectDate}
                onInputFocus={() => {
                    freshEntryRef.current = true;
                    setIsSelected(true);
                }}
                onAdjust={doAdjust}
                onLongPress={startLongPress}
                onPressOut={stopLongPress}
                onKeypadPress={handleKeypadPress}
                onSave={handleSave}
            />
        </SafeAreaView>
    );
};

const styles = createStyles(() => ({
    screen:        { flex: 1, backgroundColor: colors.background.primary },
    loadingScreen: { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' },
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[5] },

    bottomBar: {
        position:          'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing[4],
        paddingTop:        spacing[3],
        backgroundColor:   colors.background.primary,
        borderTopWidth:    1,
        borderTopColor:    colors.border.default,
    },
    logButton: {
        backgroundColor: colors.accent.primary,
        borderRadius:    radius[3],
        paddingVertical: spacing[4],
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             spacing[2],
    },
    logButtonText: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText, letterSpacing: 0.3 },

}));

export default WeightTracker;