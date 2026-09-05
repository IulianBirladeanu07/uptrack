import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal, Pressable,
    ActivityIndicator, Platform, Vibration, Animated, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../auth/services/firebaseConfigService';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import {
    validateWeight,
    loadUserWeightData,
    handleSaveLogic,
    processWeightInsForDisplay,
    adjustWeight,
} from '../../helpers/weightTrackerUtils';
import WeightChart, { getAvailablePeriods } from './WeightChart';
import { isSuspiciousWeightEntry, getCurrentTrendWeight } from '../../../profile/utils/weightTrendEngine';
import { useFoodContext } from '../../context/FoodContext';

const WEEK_DAYS          = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS         = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATE_OPTIONS_COUNT = 7;

const KEYPAD_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
];

const formatDate = (d) => {
    const val = d instanceof Date && !isNaN(d) ? d : new Date();
    if (val.toDateString() === new Date().toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (val.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return val.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatWeekLabel = (weekStartStr) => {
    const [y, m, d] = weekStartStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const buildDateOptions = () =>
    Array.from({ length: DATE_OPTIONS_COUNT }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
    });

const buildWeeklyGroups = (weightIns) => {
    if (!weightIns?.length) return [];
    const dayKeyOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return [...weightIns]
        .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
        .map((week, idx, arr) => {
            const days = dayKeyOrder
                .map((key, i) => {
                    const val = week.days?.[key];
                    if (val == null) return null;
                    const [y, m, d] = week.weekStart.split('-').map(Number);
                    const date = new Date(y, m - 1, d + i);
                    return {
                        key,
                        weight: parseFloat(val),
                        date,
                    };
                })
                .filter(Boolean);

            const prevWeek = arr[idx + 1];
            const trend = (week.average != null && prevWeek?.average != null)
                ? parseFloat((week.average - prevWeek.average).toFixed(2))
                : null;

            return {
                weekStart:  week.weekStart,
                average:    week.average ?? null,
                days,
                trend,
                daysLogged: days.length,
            };
        });
};

const serializeWeightIns = (weightIns) =>
    (weightIns || []).map(w => ({
        ...w,
        days: w.days
            ? Object.fromEntries(
                Object.entries(w.days).map(([k, v]) => [k, v])
              )
            : {},
    }));

const TrendBadge = ({ value, isBulking }) => {
    if (value == null) return null;
    const isGood = isBulking ? value > 0 : value < 0;
    const color  = value === 0
        ? colors.text.quaternary
        : isGood ? colors.accent.success : colors.accent.error;
    const bg = value === 0
        ? colors.faded.surface
        : isGood ? colors.faded.successAlt : colors.faded.errorAlt;
    return (
        <View style={[styles.trendChip, { backgroundColor: bg }]}>
            <Text style={[styles.trendChipText, { color }]}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}
            </Text>
        </View>
    );
};

const WeekRow = ({ group, isBulking, expanded, onToggle }) => {
    const hasAverage = group.average != null;
    return (
        <View>
            <TouchableOpacity
                style={styles.weekHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.weekHeaderLeft}>
                    <Text style={styles.weekLabel}>Week of {formatWeekLabel(group.weekStart)}</Text>
                    <Text style={styles.weekMeta}>{group.daysLogged} day{group.daysLogged !== 1 ? 's' : ''} logged</Text>
                </View>
                <View style={styles.weekHeaderRight}>
                    {hasAverage && (
                        <View style={styles.weekAverageRow}>
                            <Text style={styles.weekAverage}>{group.average.toFixed(1)}</Text>
                            <Text style={styles.weekAverageUnit}> kg</Text>
                        </View>
                    )}
                    <TrendBadge value={group.trend} isBulking={isBulking} />
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.text.quaternary}
                    />
                </View>
            </TouchableOpacity>

            {expanded && group.days.length > 0 && (
                <View style={styles.dayList}>
                    {group.days.map((day, i) => (
                        <View key={day.key} style={[styles.dayRow, i === group.days.length - 1 && styles.dayRowLast]}>
                            <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
                            <View style={styles.dayWeightRow}>
                                <Text style={styles.dayWeight}>{day.weight.toFixed(1)}</Text>
                                <Text style={styles.dayWeightUnit}> kg</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const DatePill = ({ date, label, isSelected, hasEntry, onPress }) => (
    <TouchableOpacity
        style={[styles.datePill, isSelected && styles.datePillSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.datePillDay, isSelected && styles.datePillDaySelected]}>{label}</Text>
        <Text style={[styles.datePillNum, isSelected && styles.datePillNumSelected]}>{date.getDate()}</Text>
        <View style={[styles.datePillDot, hasEntry && (isSelected ? styles.datePillDotOnSelected : styles.datePillDotFilled)]} />
    </TouchableOpacity>
);

const Keypad = ({ onPress }) => (
    <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, i) => (
            <View key={i} style={styles.keypadRow}>
                {row.map(key => (
                    <TouchableOpacity
                        key={key}
                        style={styles.keypadKey}
                        onPress={() => onPress(key)}
                        activeOpacity={0.6}
                    >
                        {key === 'backspace'
                            ? <Ionicons name="backspace-outline" size={20} color={colors.text.primary} />
                            : <Text style={styles.keypadKeyText}>{key}</Text>}
                    </TouchableOpacity>
                ))}
            </View>
        ))}
    </View>
);

const WeightTracker = () => {
    const navigation  = useNavigation();
    const insets      = useSafeAreaInsets();
    const { getMealCache } = useFoodContext();

    const [userId,         setUserId]         = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [modalVisible,   setModalVisible]   = useState(false);
    const [chartPeriod,    setChartPeriod]    = useState('7');
    const [expandedWeeks,  setExpandedWeeks]  = useState({});
    const [chartWidth,     setChartWidth]     = useState(0);
    const [chartDelta,     setChartDelta]     = useState(null);

    const [weightInput, setWeightInput] = useState('');
    const [isValid,     setIsValid]     = useState(true);
    const [isSelected,  setIsSelected]  = useState(false);

    const [committedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [modalDate, setModalDate] = useState(committedDate);

    const [currentWeight,   setCurrentWeight]   = useState(null);
    const [weeklyData,      setWeeklyData]      = useState(null);
    const [weeklyAverage,   setWeeklyAverage]   = useState(null);
    const [lastWeekAverage, setLastWeekAverage] = useState(null);
    const [trendData,       setTrendData]       = useState([]);
    const [weightIns,       setWeightIns]       = useState([]);
    const [startWeight,     setStartWeight]     = useState(null);
    const [goalWeight,      setGoalWeight]      = useState(null);
    const [goalSwitchDate,  setGoalSwitchDate]  = useState(null);

    const longPressTimer    = useRef(null);
    const longPressInterval = useRef(null);
    const freshEntryRef     = useRef(true);
    const cursorOpacity     = useRef(new Animated.Value(1)).current;
    const dateOptions       = useMemo(() => buildDateOptions(), []);

    const isBulking    = goalWeight != null && startWeight != null && goalWeight > startWeight;
    const weeklyGroups = useMemo(() => buildWeeklyGroups(weightIns), [weightIns]);
    const availablePeriods = useMemo(() => {
        const periods = getAvailablePeriods(trendData, goalSwitchDate);
        return periods.map(p => p.key === 'PHASE' ? { ...p, label: isBulking ? 'Bulk' : 'Cut' } : p);
    }, [trendData, goalSwitchDate, isBulking]);

    useEffect(() => {
        if (!availablePeriods.some(p => p.key === chartPeriod)) {
            setChartPeriod('7');
        }
    }, [availablePeriods, chartPeriod]);

    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        await loadUserWeightData(
            userId, committedDate,
            setCurrentWeight, setWeightInput, setWeeklyData,
            setWeeklyAverage, setLastWeekAverage, setTrendData,
            setWeightIns, setStartWeight, setGoalWeight,
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
            return;
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

    const progressPercent = useMemo(() => {
        if (currentWeight == null || startWeight == null || goalWeight == null) return 0;
        const total = Math.abs(goalWeight - startWeight);
        if (total === 0) return 100;
        return Math.min(Math.max((Math.abs(currentWeight - startWeight) / total) * 100, 0), 100);
    }, [currentWeight, startWeight, goalWeight]);

    const remaining = (currentWeight != null && goalWeight != null)
        ? parseFloat(Math.abs(currentWeight - goalWeight).toFixed(1)) : null;

    const isExistingEntry = useMemo(() => {
        const key = modalDate.toISOString().split('T')[0];
        return allEntries.some(e => e.dateKey === key);
    }, [modalDate, allEntries]);

    const showError = !isValid && weightInput !== '';

    const handleKeypadPress = (key) => {
        if (Platform.OS === 'ios') Vibration.vibrate(5);

        const isFresh = freshEntryRef.current;
        freshEntryRef.current = false;
        setIsSelected(false);

        let next = weightInput;
        if (key === 'backspace') {
            next = weightInput.slice(0, -1);
        } else if (key === '.') {
            const base = isFresh ? '' : weightInput;
            if (base.includes('.')) return;
            next = base === '' ? '0.' : base + '.';
        } else {
            const base = isFresh ? '' : weightInput;
            const [, decimals] = base.split('.');
            if (decimals != null && decimals.length >= 1) return;
            const digitsOnly = base.replace('.', '');
            if (digitsOnly.length >= 4) return;
            next = base + key;
        }
        setWeightInput(next);
        setIsValid(next !== '' && validateWeight(next));
    };

    const doAdjust = useCallback((delta) => {
        if (Platform.OS === 'ios') Vibration.vibrate(10);
        freshEntryRef.current = false;
        setIsSelected(false);
        setWeightInput(prev => adjustWeight(prev, delta));
        setIsValid(true);
    }, []);

    const startLongPress = useCallback((delta) => {
        longPressTimer.current = setTimeout(() => {
            longPressInterval.current = setInterval(() => doAdjust(delta), 80);
        }, 400);
    }, [doAdjust]);

    const stopLongPress = useCallback(() => {
        clearTimeout(longPressTimer.current);
        clearInterval(longPressInterval.current);
    }, []);

    const selectDate = useCallback((d) => {
        setModalDate(d);
        const key   = d.toISOString().split('T')[0];
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

const commitWeightSave = async (parsedWeight) => {
        setSaving(true);
        try {
            await handleSaveLogic(
                userId, parsedWeight, modalDate,
                setCurrentWeight, setWeeklyAverage, loadData,
                getMealCache(),
            );
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

        if (isSuspiciousWeightEntry(parsedWeight, currentTrendWeight)) {
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

    const toggleWeek = useCallback((weekStart) => {
        setExpandedWeeks(prev => ({ ...prev, [weekStart]: !prev[weekStart] }));
    }, []);

    const weekChangeColor = weeklyAverage != null && lastWeekAverage != null
        ? (isBulking
            ? (weeklyAverage >= lastWeekAverage ? colors.accent.success : colors.accent.error)
            : (weeklyAverage <= lastWeekAverage ? colors.accent.success : colors.accent.error))
        : colors.text.primary;

    const weekChangeDelta = weeklyAverage != null && lastWeekAverage != null
        ? parseFloat((weeklyAverage - lastWeekAverage).toFixed(1))
        : null;

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
                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <Text style={styles.eyebrow}>Today's Weight</Text>
                        {loggedCount > 0 && (
                            <Text style={styles.loggedCount}>{loggedCount}/7 logged</Text>
                        )}
                    </View>

                    <View style={styles.heroWeightRow}>
                        <Text style={styles.heroWeight}>
                            {currentWeight != null ? currentWeight.toFixed(1) : '--.-'}
                        </Text>
                        <Text style={styles.heroUnit}>kg</Text>
                    </View>

                    {startWeight != null && goalWeight != null ? (
                        <View style={styles.progressSection}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                            </View>
                            <View style={styles.progressLabels}>
                                <Text style={styles.progressLabelSide}>{startWeight.toFixed(1)} kg</Text>
                                <Text style={styles.progressPercent}>{progressPercent.toFixed(0)}% to goal</Text>
                                <Text style={[styles.progressLabelSide, { color: colors.accent.primary }]}>
                                    {goalWeight.toFixed(1)} kg
                                </Text>
                            </View>
                        </View>
                    ) : currentWeight == null ? (
                        <Text style={styles.emptyHeroText}>Log your first weight to start tracking</Text>
                    ) : null}

                    <View style={styles.statRow}>
                        <View style={styles.statCell}>
                            <Text style={styles.statValue}>
                                {lastWeekAverage != null ? lastWeekAverage.toFixed(1) : '--'}
                            </Text>
                            <Text style={styles.statLabel}>Last Week</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCell}>
                            <View style={styles.statValueRow}>
                                <Text style={styles.statValue}>
                                    {weeklyAverage != null ? weeklyAverage.toFixed(1) : '--'}
                                </Text>
                                {weekChangeDelta != null && (
                                    <View style={[styles.deltaChip, {
                                        backgroundColor: weekChangeDelta === 0
                                            ? colors.faded.surface
                                            : (!isBulking ? weekChangeDelta < 0 : weekChangeDelta > 0)
                                                ? colors.faded.successAlt
                                                : colors.faded.errorAlt,
                                    }]}>
                                        <Text style={[styles.deltaChipText, { color: weekChangeColor }]}>
                                            {weekChangeDelta > 0 ? '+' : ''}{weekChangeDelta.toFixed(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.statLabel}>This Week</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCell}>
                            <Text style={styles.statValue}>
                                {remaining != null ? remaining.toFixed(1) : '--'}
                            </Text>
                            <Text style={styles.statLabel}>To Goal</Text>
                        </View>
                    </View>
                </View>

                <View
                    style={styles.card}
                    onLayout={e => setChartWidth(e.nativeEvent.layout.width - spacing[5] * 2)}
                >
                    <View style={styles.periodTrack}>
                        {availablePeriods.map(p => (
                            <TouchableOpacity
                                key={p.key}
                                style={[styles.periodPill, chartPeriod === p.key && styles.periodPillActive]}
                                onPress={() => setChartPeriod(p.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.periodPillText, chartPeriod === p.key && styles.periodPillTextActive]}>
                                    {p.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.progressDelta, chartDelta && { color: chartDelta.color }]}>
                        {chartDelta
                            ? `${chartDelta.value > 0 ? '+' : ''}${chartDelta.value.toFixed(1)} kg since ${chartDelta.since}`
                            : 'Not enough data yet'}
                    </Text>

                    {chartWidth > 0 && (
                        <WeightChart
                            data={trendData}
                            period={chartPeriod}
                            isBulking={isBulking}
                            width={chartWidth}
                            onDeltaChange={setChartDelta}
                            goalSwitchDate={goalSwitchDate}
                            startWeight={startWeight}
                        />
                    )}
                </View>

                {weeklyGroups.length > 0 && (
                    <View style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.cardTitle}>History</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('WeightHistory', {
                                    weightIns:   serializeWeightIns(weightIns),
                                    isBulking,
                                    startWeight,
                                    goalWeight,
                                })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewAllText}>View all</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.historyList}>
                            {weeklyGroups.slice(0, 8).map((group, i) => (
                                <View key={group.weekStart}>
                                    {i > 0 && <View style={styles.weekDivider} />}
                                    <WeekRow
                                        group={group}
                                        isBulking={isBulking}
                                        expanded={!!expandedWeeks[group.weekStart]}
                                        onToggle={() => toggleWeek(group.weekStart)}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[3] }]}>
                <TouchableOpacity style={styles.logButton} onPress={openModal} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.accent.buttonText} />
                    <Text style={styles.logButtonText}>Log Weight</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Pressable
                        style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing[4] }]}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={styles.modalHandle} />
                        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Log Weight</Text>
                                    <Text style={styles.modalSubtitle}>{formatDate(modalDate)}</Text>
                                </View>
                                <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={16} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateStrip}>
                                {dateOptions.map(d => {
                                    const key       = d.toISOString().split('T')[0];
                                    const formatted = formatDate(d);
                                    const label     = formatted === 'Today' ? 'Today'
                                        : formatted === 'Yesterday' ? 'Yest'
                                        : d.toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                        <DatePill
                                            key={key}
                                            date={d}
                                            label={label}
                                            isSelected={d.toDateString() === modalDate.toDateString()}
                                            hasEntry={allEntries.some(e => e.dateKey === key)}
                                            onPress={() => selectDate(d)}
                                        />
                                    );
                                })}
                            </View>

                            {allEntries[0] && (
                                <View style={styles.lastLogged}>
                                    <View style={styles.lastLoggedInner}>
                                        <View>
                                            <Text style={styles.lastLoggedLabel}>Last logged</Text>
                                            <View style={styles.lastLoggedRow}>
                                                <Text style={styles.lastLoggedWeight}>{allEntries[0].weight.toFixed(1)}</Text>
                                                <Text style={styles.lastLoggedUnit}> kg</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.lastLoggedDate}>{formatDate(allEntries[0].date)}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.stepperRow}>
                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => doAdjust(-0.1)}
                                    onLongPress={() => startLongPress(-0.1)}
                                    onPressOut={stopLongPress}
                                    delayLongPress={400}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="remove" size={24} color={colors.text.primary} />
                                </TouchableOpacity>

                                <View style={styles.weightInputRow}>
                                    <Pressable
                                        onPress={() => {
                                            freshEntryRef.current = true;
                                            setIsSelected(true);
                                        }}
                                        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                                        style={[styles.weightInputBox, isSelected && styles.weightInputBoxSelected]}
                                    >
                                        <Text style={[styles.weightInput, showError && styles.weightInputError]}>
                                            {weightInput || '0.0'}
                                        </Text>
                                    </Pressable>
                                    <Text style={[styles.weightUnit, showError && styles.weightUnitError]}>kg</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => doAdjust(0.1)}
                                    onLongPress={() => startLongPress(0.1)}
                                    onPressOut={stopLongPress}
                                    delayLongPress={400}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={24} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.updateHint, !isExistingEntry && styles.updateHintHidden]}>
                                updates existing entry
                            </Text>

                            <Keypad onPress={handleKeypadPress} />

                            <TouchableOpacity
                                style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={!isValid || saving}
                                activeOpacity={0.8}
                            >
                                {saving
                                    ? <ActivityIndicator size="small" color={colors.accent.buttonText} />
                                    : <Ionicons
                                        name={isExistingEntry ? 'refresh' : 'checkmark-circle'}
                                        size={18}
                                        color={(!isValid || saving) ? colors.text.quaternary : colors.accent.buttonText}
                                      />
                                }
                                <Text style={[styles.saveBtnText, (!isValid || saving) && styles.saveBtnTextDisabled]}>
                                    {saving
                                        ? (isExistingEntry ? 'Updating...' : 'Saving...')
                                        : (isExistingEntry ? 'Update Entry' : 'Save Entry')}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = createStyles(() => ({
    screen:        { flex: 1, backgroundColor: colors.background.primary },
    loadingScreen: { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' },
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[5] },

    heroCard: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        padding:         spacing[5],
        marginTop:       spacing[3],
    },
    heroTopRow: {
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   spacing[2],
    },
    eyebrow: {
        fontSize:      fontSize[12],
        fontWeight:    fontWeight.bold,
        color:         colors.text.quaternary,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    loggedCount: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary },

    heroWeightRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing[1], marginBottom: spacing[4] },
    heroWeight:    { fontSize: fontSize[56], fontWeight: fontWeight.black, color: colors.text.primary, letterSpacing: -4, lineHeight: 64, includeFontPadding: false },
    heroUnit:      { fontSize: fontSize[20], fontWeight: fontWeight.semibold, color: colors.text.secondary, marginBottom: spacing[2] },
    emptyHeroText: { fontSize: fontSize[12], color: colors.text.quaternary, marginBottom: spacing[4], textAlign: 'center' },

    progressSection: { marginBottom: spacing[2] },
    progressTrack:   { height: 8, backgroundColor: colors.background.tertiary, borderRadius: radius[1], overflow: 'hidden', marginBottom: spacing[2] },
    progressFill:    { height: '100%', backgroundColor: colors.accent.primary, borderRadius: radius[1] },
    progressLabels:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabelSide: { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary },
    progressPercent:   { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.secondary },

    statRow:     { flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: colors.border.default, marginTop: spacing[3], paddingTop: spacing[3] },
    statCell:    { flex: 1, alignItems: 'center', gap: 2 },
    statValue:   { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    statLabel:    { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider:  { width: 1, height: spacing[8], backgroundColor: colors.border.default, marginTop: 2 },
    deltaChip: {
        paddingHorizontal: spacing[1],
        paddingVertical:   1,
        borderRadius:      radius[1],
        alignItems:        'center',
        marginLeft: spacing[1],
    },
    deltaChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },

    card: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        padding:         spacing[5],
    },
    cardTitle:   { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
    viewAllText: { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.accent.primary },
    progressDelta: {
        fontSize:     fontSize[12],
        fontWeight:   fontWeight.semibold,
        color:        colors.text.quaternary,
        marginBottom: spacing[3],
    },

    periodTrack: {
        flexDirection: 'row',
        gap:           spacing[5],
        marginBottom:  spacing[4],
    },
    periodPill: {
        paddingBottom:     spacing[2],
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    periodPillActive:     { borderBottomColor: colors.accent.primary },
    periodPillText:       { fontSize: fontSize[12], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
    periodPillTextActive: { color: colors.text.primary, fontWeight: fontWeight.bold },

    historyCard: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        overflow:        'hidden',
    },
    historyHeader: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingTop:        spacing[4],
        paddingBottom:     spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    historyList: { paddingHorizontal: spacing[4] },

    weekDivider: { height: 1, backgroundColor: colors.border.light },
    weekHeader: {
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'space-between',
        paddingVertical: spacing[3],
    },
    weekHeaderLeft:  { flex: 1 },
    weekHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    weekLabel:       { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.primary },
    weekMeta:        { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: 2 },
    weekAverageRow:  { flexDirection: 'row', alignItems: 'baseline' },
    weekAverage:     { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    weekAverageUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },

    trendChip: {
        paddingHorizontal: spacing[2],
        paddingVertical:   2,
        borderRadius:      radius[1],
        minWidth:          36,
        alignItems:        'center',
    },
    trendChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },

    dayList:      { paddingBottom: spacing[2] },
    dayRow: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingVertical:   spacing[2],
        paddingLeft:       spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    dayRowLast:    { borderBottomWidth: 0 },
    dayLabel:      { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    dayWeightRow:  { flexDirection: 'row', alignItems: 'baseline' },
    dayWeight:     { fontSize: fontSize[14], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    dayWeightUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },

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

    modalOverlay: { flex: 1, backgroundColor: colors.background.overlay, justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor:      colors.background.secondary,
        borderTopLeftRadius:  radius[5],
        borderTopRightRadius: radius[5],
        borderTopWidth:       1,
        borderLeftWidth:      1,
        borderRightWidth:     1,
        borderColor:          colors.border.default,
        paddingHorizontal:    spacing[5],
        maxHeight:            '85%',
    },
    modalHandle: {
        width:           spacing[9],
        height:          4,
        borderRadius:    2,
        backgroundColor: colors.border.default,
        alignSelf:       'center',
        marginVertical:  spacing[3],
    },
    modalHeader: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingBottom:     spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        marginBottom:      spacing[4],
    },
    modalTitle:    { fontSize: fontSize[20], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.3 },
    modalSubtitle: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: 2 },
    modalCloseBtn: {
        width:           spacing[8],
        height:          spacing[8],
        borderRadius:    radius[2],
        backgroundColor: colors.faded.surfaceMedium,
        borderWidth:     1,
        borderColor:     colors.border.default,
        alignItems:      'center',
        justifyContent:  'center',
    },
    dateStrip: { flexDirection: 'row', gap: spacing[2], paddingVertical: spacing[1], marginBottom: spacing[4] },
    datePill: {
        flex:              1,
        paddingVertical:   spacing[3],
        borderRadius:      radius[3],
        backgroundColor:   colors.background.tertiary,
        borderWidth:       1,
        borderColor:       colors.border.default,
        alignItems:        'center',
        gap:               spacing[1],
    },
    datePillSelected:    { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    datePillDay:         { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.4 },
    datePillDaySelected: { color: colors.accent.buttonText },
    datePillNum:         { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    datePillNumSelected: { color: colors.accent.buttonText },
    datePillDot:         { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 2 },
    datePillDotFilled:   { backgroundColor: colors.accent.primary },
    datePillDotOnSelected: { backgroundColor: colors.accent.buttonText },
    lastLogged: {
        backgroundColor:   colors.background.tertiary,
        borderRadius:      radius[3],
        borderWidth:       1,
        borderColor:       colors.border.default,
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[3],
        marginBottom:      spacing[4],
    },
    lastLoggedInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    lastLoggedLabel:  { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.accent.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[1] },
    lastLoggedRow:    { flexDirection: 'row', alignItems: 'baseline' },
    lastLoggedWeight: { fontSize: fontSize[22], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    lastLoggedUnit:   { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.secondary },
    lastLoggedDate:   { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },

    stepperRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4], marginBottom: spacing[1] },
    stepperBtn:     { width: spacing[12], height: spacing[12], borderRadius: radius[5], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    weightInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1] },

    weightInputBox: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderBottomWidth: 2,
        borderBottomColor: colors.border.default,
    },
    weightInputBoxSelected: {
        borderBottomColor: colors.accent.primary,
    },    
    weightInput: {
        fontSize:           fontSize[56],
        fontWeight:         fontWeight.black,
        color:              colors.text.primary,
        textAlign:          'center',
        minWidth:           spacing[28],
        letterSpacing:      -4,
        includeFontPadding: false,
    },
    weightInputError: { color: colors.accent.error },

    weightUnit:       { fontSize: fontSize[20], fontWeight: fontWeight.semibold, color: colors.text.secondary },
    weightUnitError:  { color: colors.accent.error },
    updateHint: {
        fontSize:      fontSize[10],
        fontWeight:    fontWeight.medium,
        color:         colors.text.quaternary,
        letterSpacing: 0.2,
        textAlign:     'center',
        marginBottom:  spacing[4],
    },
    updateHintHidden: { opacity: 0 },

    keypad:    { gap: spacing[2], marginBottom: spacing[4] },
    keypadRow: { flexDirection: 'row', gap: spacing[2] },
    keypadKey: {
        flex:            1,
        height:          spacing[12],
        borderRadius:    radius[3],
        backgroundColor: colors.background.tertiary,
        borderWidth:     1,
        borderColor:     colors.border.default,
        alignItems:      'center',
        justifyContent:  'center',
    },
    keypadKeyText: { fontSize: fontSize[24], fontWeight: fontWeight.bold, color: colors.text.primary },

    saveBtn: {
        backgroundColor: colors.accent.primary,
        borderRadius:    radius[3],
        paddingVertical: spacing[4],
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             spacing[2],
    },
    saveBtnDisabled:     { backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
    saveBtnText:         { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText, letterSpacing: 0.3 },
    saveBtnTextDisabled: { color: colors.text.quaternary },
}));

export default WeightTracker;