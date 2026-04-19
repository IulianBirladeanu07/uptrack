import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal, Pressable,
    TextInput, ActivityIndicator, Platform, Vibration,
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
import WeightChart from './WeightChart';

const WEEK_DAYS          = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS         = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_OPTIONS_COUNT = 7;
const PREVIEW_COUNT      = 4;

const formatDate = (d) => {
    const val = d instanceof Date && !isNaN(d) ? d : new Date();
    if (val.toDateString() === new Date().toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (val.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return val.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const buildDateOptions = () =>
    Array.from({ length: DATE_OPTIONS_COUNT }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
    });

const parseRecentEntries = (rawEntries) => {
    const processed = processWeightInsForDisplay(rawEntries, 60);
    return processed.map((e, i, arr) => ({
        ...e,
        id:          e.id || `${new Date(e.date).getTime()}-${i}`,
        change:      i < arr.length - 1 ? e.weight - arr[i + 1].weight : 0,
        displayDate: formatDate(e.date),
    }));
};

const EntryRow = ({ entry, isLast, isBulking }) => {
    const hasChange   = Math.abs(entry.change) > 0.05;
    const isGain      = entry.change > 0;
    const isPositive  = isBulking ? isGain : !isGain;
    const changeColor = isPositive ? colors.accent.success : colors.accent.error;
    const changeLabel = `${isGain ? '+' : ''}${entry.change.toFixed(1)}`;

    return (
        <View style={[styles.entryRow, isLast && styles.entryRowLast]}>
            <Text style={styles.entryDate}>{entry.displayDate}</Text>
            <View style={styles.entryWeightRow}>
                <Text style={styles.entryWeight}>{entry.weight.toFixed(1)}</Text>
                <Text style={styles.entryWeightUnit}> kg</Text>
            </View>
            {hasChange
                ? <Text style={[styles.deltaPillText, { color: changeColor }]}>{changeLabel}</Text>
                : <Text style={styles.deltaNeutral}>—</Text>
            }
        </View>
    );
};

const StatCell = ({ value, label, color }) => (
    <View style={styles.statCell}>
        <Text style={[styles.statValue, color && { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const WeightTracker = () => {
    const navigation  = useNavigation();
    const insets      = useSafeAreaInsets();

    const [userId,         setUserId]         = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [modalVisible,   setModalVisible]   = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [chartPeriod,    setChartPeriod]    = useState('7');

    const [weightInput, setWeightInput] = useState('');
    const [isValid,     setIsValid]     = useState(true);

    const [committedDate, setCommittedDate] = useState(() => {
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
    const [recentEntries,   setRecentEntries]   = useState([]);
    const [startWeight,     setStartWeight]     = useState(null);
    const [goalWeight,      setGoalWeight]      = useState(null);

    const longPressTimer    = useRef(null);
    const longPressInterval = useRef(null);
    const dateOptions       = useMemo(() => buildDateOptions(), []);

    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        await loadUserWeightData(
            userId, committedDate,
            setCurrentWeight, setWeightInput, setWeeklyData,
            setWeeklyAverage, setLastWeekAverage, setTrendData,
        );
        try {
            const snap = await getDoc(doc(db, 'users', userId));
            if (snap.exists()) {
                const d = snap.data();
                setRecentEntries(parseRecentEntries(d.weightIns || []));
                setStartWeight(d.startWeight ?? null);
                setGoalWeight(d.targetWeight ?? null);
            }
        } catch (e) {
            console.error('WeightTracker loadData:', e);
        }
        setLoading(false);
    }, [userId, committedDate]);

    useEffect(() => {
        const user = getAuth().currentUser;
        if (user) setUserId(user.uid);
        else      setLoading(false);
    }, []);

    useEffect(() => { if (userId) loadData(); }, [userId, loadData]);

    const isBulking = goalWeight != null && currentWeight != null && goalWeight > currentWeight;

    const streak = useMemo(() => {
        if (!recentEntries.length) return 0;
        const set = new Set(recentEntries.map(e => e.dateKey));
        const cur = new Date();
        cur.setHours(0, 0, 0, 0);
        if (!set.has(cur.toISOString().split('T')[0])) cur.setDate(cur.getDate() - 1);
        let n = 0;
        while (n < 365) {
            if (set.has(cur.toISOString().split('T')[0])) { n++; cur.setDate(cur.getDate() - 1); }
            else break;
        }
        return n;
    }, [recentEntries]);

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

    const weightChange = (currentWeight != null && startWeight != null)
        ? currentWeight - startWeight : null;

    const remaining = (currentWeight != null && goalWeight != null)
        ? Math.abs(currentWeight - goalWeight) : null;

    const isExistingEntry = useMemo(() => {
        const key = modalDate.toISOString().split('T')[0];
        return recentEntries.some(e => e.dateKey === key);
    }, [modalDate, recentEntries]);

    const handleWeightChange = (v) => { setWeightInput(v); setIsValid(validateWeight(v)); };

    const doAdjust = useCallback((delta) => {
        if (Platform.OS === 'ios') Vibration.vibrate(10);
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

    const handleSave = async () => {
        if (!validateWeight(weightInput)) return;
        setSaving(true);
        try {
            await handleSaveLogic(
                userId, parseFloat(weightInput), modalDate,
                setCurrentWeight, setWeeklyAverage, loadData,
            );
            setCommittedDate(modalDate);
            setModalVisible(false);
        } catch (e) {
            console.error('handleSave:', e);
        } finally {
            setSaving(false);
        }
    };

    const openModal = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setModalDate(today);
        if (recentEntries[0]) { setWeightInput(recentEntries[0].weight.toFixed(1)); setIsValid(true); }
        setDatePickerOpen(false);
        setModalVisible(true);
    };

    const closeModal = () => { setModalVisible(false); setDatePickerOpen(false); };

    const statCellData = [
        {
            id:    'since_start',
            value: weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '--',
            label: 'Since Start',
        },
        { id: 'to_goal',   value: remaining?.toFixed(1) ?? '--',                          label: 'To Goal'   },
        { id: 'this_week', value: weeklyAverage != null ? weeklyAverage.toFixed(1) : '--', label: 'This Week' },
    ];

    const previewEntries = recentEntries.slice(0, PREVIEW_COUNT);
    const hasMore        = recentEntries.length > PREVIEW_COUNT;

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
                        <Text style={styles.eyebrow}>Current Weight</Text>
                        {streak > 0 && (
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakText}>{loggedCount}/7 this week</Text>
                            </View>
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
                        {statCellData.map((cell, i) => (
                            <View key={cell.id} style={styles.statRowItem}>
                                {i > 0 && <View style={styles.statDivider} />}
                                <StatCell value={cell.value} label={cell.label} color={cell.color} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Progress</Text>
                        <View style={styles.periodPills}>
                            {[
                                { key: '7',   label: 'Week'  },
                                { key: '90',  label: 'Month' },
                                { key: '365', label: 'Year'  },
                            ].map(p => (
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
                    </View>
                    <WeightChart data={trendData} period={chartPeriod} />
                </View>

                {recentEntries.length > 0 && (
                    <View style={styles.entriesCard}>
                        <View style={styles.entriesHeader}>
                            <Text style={styles.cardTitle}>Recent</Text>
                            <Text style={styles.cardTitleRight}>{recentEntries.length} logged</Text>
                        </View>
                        {previewEntries.map((entry, i) => (
                            <EntryRow
                                key={entry.id}
                                entry={entry}
                                isLast={i === previewEntries.length - 1 && !hasMore}
                                isBulking={isBulking}
                            />
                        ))}
                        {hasMore && (
                            <TouchableOpacity
                                style={styles.viewAllBtn}
                                onPress={() => navigation.navigate('WeightHistory', { entries: recentEntries, isBulking })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewAllText}>View all {recentEntries.length} entries</Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.accent.primary} />
                            </TouchableOpacity>
                        )}
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

                            <TouchableOpacity
                                style={styles.dateTrigger}
                                onPress={() => setDatePickerOpen(p => !p)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
                                <Text style={styles.dateTriggerText}>{formatDate(modalDate)}</Text>
                                <Ionicons
                                    name={datePickerOpen ? 'chevron-up' : 'chevron-down'}
                                    size={14}
                                    color={colors.text.quaternary}
                                />
                            </TouchableOpacity>

                            {datePickerOpen && (
                                <View style={styles.datePicker}>
                                    {dateOptions.map(d => {
                                        const key        = d.toISOString().split('T')[0];
                                        const isSelected = d.toDateString() === modalDate.toDateString();
                                        const hasEntry   = recentEntries.some(e => e.dateKey === key);
                                        return (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                                                onPress={() => { setModalDate(d); setDatePickerOpen(false); }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.dateOptionLeft}>
                                                    {isSelected && <View style={styles.dateSelectedDot} />}
                                                    <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>
                                                        {formatDate(d)}
                                                    </Text>
                                                </View>
                                                {hasEntry && (
                                                    <View style={styles.dateEntryBadge}>
                                                        <Text style={styles.dateEntryBadgeText}>logged</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {recentEntries[0] && (
                                <View style={styles.lastLogged}>
                                    <View style={styles.lastLoggedInner}>
                                        <View>
                                            <Text style={styles.lastLoggedLabel}>Last logged</Text>
                                            <View style={styles.lastLoggedRow}>
                                                <Text style={styles.lastLoggedWeight}>{recentEntries[0].weight.toFixed(1)}</Text>
                                                <Text style={styles.lastLoggedUnit}> kg</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.lastLoggedDate}>{recentEntries[0].displayDate}</Text>
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

                                <View style={styles.weightDisplay}>
                                    <View style={styles.weightInputRow}>
                                        <TextInput
                                            style={[styles.weightInput, !isValid && styles.weightInputError]}
                                            value={weightInput}
                                            onChangeText={handleWeightChange}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                            maxLength={6}
                                            placeholder="0.0"
                                            placeholderTextColor={colors.text.quaternary}
                                        />
                                        <Text style={[styles.weightUnit, !isValid && styles.weightUnitError]}>kg</Text>
                                    </View>
                                    {isExistingEntry && (
                                        <Text style={styles.updateHint}>updates existing entry</Text>
                                    )}
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
    scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[3] },

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
    streakBadge: {
        paddingHorizontal: spacing[2],
        paddingVertical:   spacing[1],
        borderRadius:      radius[2],
        borderWidth:       1,
        borderColor:       colors.accent.primary,
        backgroundColor:   colors.accent.primary,
    },
    streakText: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.accent.buttonText },

    heroWeightRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing[1], marginBottom: spacing[4] },
    heroWeight:    { fontSize: fontSize[56], fontWeight: fontWeight.black, color: colors.text.primary, letterSpacing: -4, lineHeight: 64, includeFontPadding: false },
    heroUnit:      { fontSize: fontSize[20], fontWeight: fontWeight.semibold, color: colors.text.secondary, marginBottom: spacing[2] },
    emptyHeroText: { fontSize: fontSize[12], color: colors.text.quaternary, marginBottom: spacing[4] },

    progressSection:   { marginBottom: spacing[2] },
    progressTrack:     { height: 6, backgroundColor: colors.background.tertiary, borderRadius: 3, overflow: 'hidden', marginBottom: spacing[2] },
    progressFill:      { height: '100%', backgroundColor: colors.accent.primary, borderRadius: 2 },
    progressLabels:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabelSide: { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary },
    progressPercent:   { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.secondary },

    statRow:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border.default, marginTop: spacing[3], paddingTop: spacing[3] },
    statRowItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    statCell:    { flex: 1, alignItems: 'center', gap: spacing[1] },
    statValue:   { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    statLabel:   { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, height: spacing[7], backgroundColor: colors.border.default },

    card: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        padding:         spacing[4],
    },
    cardHeader: {
        flexDirection:  'row',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        marginBottom:   spacing[3],
    },
    cardTitle:      { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
    cardTitleRight: { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.accent.primary },

    periodPills: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           spacing[1],
        flexShrink:    1,
    },
    periodPill: {
        paddingHorizontal: spacing[2],
        paddingVertical:   spacing[1],
        borderRadius:      radius[2],
        borderWidth:       1,
        borderColor:       colors.border.default,
    },
    periodPillActive:     { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    periodPillText:       { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
    periodPillTextActive: { color: colors.accent.buttonText, fontWeight: fontWeight.bold },

    entriesCard: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        overflow:        'hidden',
    },
    entriesHeader: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingTop:        spacing[4],
        paddingBottom:     spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    entryRow: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    entryRowLast:    { borderBottomWidth: 0 },
    entryDate:       { flex: 1, fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },
    entryWeightRow:  { flexDirection: 'row', alignItems: 'baseline', marginRight: spacing[3] },
    entryWeight:     { fontSize: fontSize[14], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    entryWeightUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    deltaPillText:   { fontSize: fontSize[12], fontWeight: fontWeight.bold, minWidth: 36, textAlign: 'right' },
    deltaNeutral:    { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.quaternary, minWidth: 36, textAlign: 'right' },

    viewAllBtn: {
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             spacing[1],
        paddingVertical: spacing[3],
        borderTopWidth:  1,
        borderTopColor:  colors.border.default,
    },
    viewAllText: { fontSize: fontSize[12], fontWeight: fontWeight.semibold, color: colors.accent.primary },

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
        backgroundColor:      colors.background.primary,
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

    dateTrigger: {
        flexDirection:     'row',
        alignItems:        'center',
        gap:               spacing[2],
        backgroundColor:   colors.background.secondary,
        borderRadius:      radius[2],
        borderWidth:       1,
        borderColor:       colors.border.default,
        paddingHorizontal: spacing[3],
        paddingVertical:   spacing[2],
        marginBottom:      spacing[4],
        alignSelf:         'flex-start',
    },
    dateTriggerText: { fontSize: fontSize[12], fontWeight: fontWeight.semibold, color: colors.text.secondary },

    datePicker: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[3],
        borderWidth:     1,
        borderColor:     colors.border.default,
        marginBottom:    spacing[3],
        overflow:        'hidden',
    },
    dateOption: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    dateOptionSelected:     { backgroundColor: colors.background.tertiary },
    dateOptionLeft:         { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    dateSelectedDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent.primary },
    dateOptionText:         { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.secondary },
    dateOptionTextSelected: { color: colors.accent.primary, fontWeight: fontWeight.bold },
    dateEntryBadge: {
        backgroundColor:   colors.faded.primary,
        borderRadius:      radius[1],
        borderWidth:       1,
        borderColor:       colors.border.primary,
        paddingHorizontal: spacing[2],
        paddingVertical:   spacing[1],
    },
    dateEntryBadgeText: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.accent.primary },

    lastLogged: {
        backgroundColor:   colors.background.secondary,
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

    stepperRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4], marginBottom: spacing[4] },
    stepperBtn:     { width: spacing[12], height: spacing[12], borderRadius: radius[5], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    weightDisplay:  { alignItems: 'center', gap: spacing[1] },
    weightInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1] },
    weightInput: {
        fontSize:           fontSize[56],
        fontWeight:         fontWeight.black,
        color:              colors.accent.primary,
        textAlign:          'center',
        minWidth:           spacing[28],
        letterSpacing:      -4,
        includeFontPadding: false,
    },
    weightInputError: { color: colors.accent.error },
    weightUnit:       { fontSize: fontSize[18], fontWeight: fontWeight.semibold, color: colors.text.secondary },
    weightUnitError:  { color: colors.accent.error },
    updateHint:       { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary, letterSpacing: 0.2 },

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
    saveBtnTextDisabled: { color: colors.text.quaternary },
    saveBtnText:         { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText, letterSpacing: 0.3 },
}));

export default WeightTracker;