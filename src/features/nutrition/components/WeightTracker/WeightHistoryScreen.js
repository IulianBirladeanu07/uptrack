import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const DAY_KEY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatWeekRange = (weekStartStr) => {
    const [y, m, d] = weekStartStr.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const end   = new Date(y, m - 1, d + 6);
    const fmt   = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
};

const formatDayLabel = (weekStartStr, dayIndex) => {
    const [y, m, d] = weekStartStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + dayIndex);
    const today     = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatMonth = (weekStartStr) => {
    const [y, m] = weekStartStr.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const groupByMonth = (weightIns) => {
    const sorted = [...weightIns].sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    const groups = {};
    sorted.forEach(week => {
        const [y, m] = week.weekStart.split('-').map(Number);
        const key = `${y}-${String(m).padStart(2, '0')}`;
        if (!groups[key]) groups[key] = { label: formatMonth(week.weekStart), weeks: [] };
        groups[key].weeks.push(week);
    });
    return Object.values(groups);
};

const TrendChip = ({ value, isBulking }) => {
    if (value == null) return <View style={{ minWidth: 40 }} />;
    const isGood  = isBulking ? value > 0 : value < 0;
    const color   = value === 0 ? colors.text.quaternary : isGood ? colors.accent.success : colors.accent.error;
    const bgColor = value === 0
        ? colors.faded.surface
        : isGood ? colors.faded.successAlt : colors.faded.errorAlt;
    return (
        <View style={[styles.trendChip, { backgroundColor: bgColor }]}>
            <Text style={[styles.trendChipText, { color }]}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}
            </Text>
        </View>
    );
};

const WeekCard = ({ week, prevWeek, isBulking, expanded, onToggle }) => {
    const days = DAY_KEY_ORDER
        .map((key, i) => {
            const val = week.days?.[key];
            if (val == null) return null;
            return { key, weight: parseFloat(val), label: formatDayLabel(week.weekStart, i) };
        })
        .filter(Boolean);

    const trend = (week.average != null && prevWeek?.average != null)
        ? parseFloat((week.average - prevWeek.average).toFixed(2))
        : null;

    return (
        <View style={styles.weekCard}>
            <TouchableOpacity
                style={styles.weekCardHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.weekCardLeft}>
                    <Text style={styles.weekRange}>{formatWeekRange(week.weekStart)}</Text>
                    <Text style={styles.weekDaysLogged}>{days.length} day{days.length !== 1 ? 's' : ''} logged</Text>
                </View>
                <View style={styles.weekCardRight}>
                    {week.average != null && (
                        <Text style={styles.weekAvg}>{week.average.toFixed(1)} kg</Text>
                    )}
                    <TrendChip value={trend} isBulking={isBulking} />
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.text.quaternary}
                    />
                </View>
            </TouchableOpacity>

            {expanded && days.length > 0 && (
                <View style={styles.dayList}>
                    {days.map((day, i) => (
                        <View
                            key={day.key}
                            style={[styles.dayRow, i === days.length - 1 && styles.dayRowLast]}
                        >
                            <Text style={styles.dayLabel}>{day.label}</Text>
                            <Text style={styles.dayWeight}>{day.weight.toFixed(1)} kg</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const WeightHistoryScreen = ({ route }) => {
    const navigation = useNavigation();
    const { weightIns = [], isBulking = false, startWeight, goalWeight } = route.params ?? {};
    const [expandedWeeks, setExpandedWeeks] = useState({});

    const monthGroups = useMemo(() => groupByMonth(weightIns), [weightIns]);

    const sortedAll = useMemo(() =>
        [...weightIns].sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart)),
    [weightIns]);

    const totalWeeks    = weightIns.length;
    const latestAverage = sortedAll[sortedAll.length - 1]?.average ?? null;

    const baseline = startWeight ?? sortedAll[0]?.average ?? null;

    const totalChange = (baseline != null && latestAverage != null)
        ? parseFloat((latestAverage - baseline).toFixed(1))
        : null;

    const changeIsGood = totalChange != null
        ? (isBulking ? totalChange > 0 : totalChange < 0)
        : null;

    const toggleWeek = (weekStart) => {
        setExpandedWeeks(prev => ({ ...prev, [weekStart]: !prev[weekStart] }));
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter} pointerEvents="none">
                    <Text style={styles.headerTitle}>Weight History</Text>
                    <Text style={styles.headerSubtitle}>{totalWeeks} week{totalWeeks !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {(baseline != null || totalChange != null) && (
                    <View style={styles.summaryCard}>
                        {baseline != null && (
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{baseline.toFixed(1)}</Text>
                                <Text style={styles.summaryLabel}>START</Text>
                            </View>
                        )}
                        {baseline != null && <View style={styles.summaryDivider} />}
                        {latestAverage != null && (
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{latestAverage.toFixed(1)}</Text>
                                <Text style={styles.summaryLabel}>CURRENT</Text>
                            </View>
                        )}
                        {totalChange != null && (
                            <>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[
                                        styles.summaryValue,
                                        changeIsGood != null && {
                                            color: changeIsGood ? colors.accent.success : colors.accent.error
                                        }
                                    ]}>
                                        {totalChange > 0 ? '+' : ''}{totalChange}
                                    </Text>
                                    <Text style={styles.summaryLabel}>TOTAL</Text>
                                </View>
                            </>
                        )}
                        {goalWeight != null && (
                            <>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.accent.primary }]}>
                                        {goalWeight.toFixed(1)}
                                    </Text>
                                    <Text style={styles.summaryLabel}>GOAL</Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {monthGroups.map(group => (
                    <View key={group.label} style={styles.monthSection}>
                        <Text style={styles.monthLabel}>{group.label}</Text>
                        <View style={styles.monthCards}>
                            {group.weeks.map((week) => {
                                const prevIdx = sortedAll.findIndex(w => w.weekStart === week.weekStart) - 1;
                                const prevWeek = prevIdx >= 0 ? sortedAll[prevIdx] : null;
                                return (
                                    <WeekCard
                                        key={week.weekStart}
                                        week={week}
                                        prevWeek={prevWeek}
                                        isBulking={isBulking}
                                        expanded={!!expandedWeeks[week.weekStart]}
                                        onToggle={() => toggleWeek(week.weekStart)}
                                    />
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = createStyles(() => ({
    screen: { flex: 1, backgroundColor: colors.background.primary },

    header: {
        flexDirection:     'row',
        alignItems:        'center',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    backBtn: {
        width:           spacing[10],
        height:          spacing[10],
        borderRadius:    radius[3],
        backgroundColor: colors.background.secondary,
        borderWidth:     1,
        borderColor:     colors.border.default,
        alignItems:      'center',
        justifyContent:  'center',
    },
    headerCenter: {
        position:   'absolute',
        left:       0,
        right:      0,
        alignItems: 'center',
        gap:        2,
    },
    headerTitle:    { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
    headerSubtitle: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },

    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[8], gap: spacing[5] },

    summaryCard: {
        flexDirection:   'row',
        alignItems:      'center',
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        paddingVertical: spacing[4],
    },
    summaryItem:    { flex: 1, alignItems: 'center', gap: spacing[1] },
    summaryValue:   { fontSize: fontSize[20], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    summaryLabel:   { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, letterSpacing: 0.8 },
    summaryDivider: { width: 1, height: spacing[8], backgroundColor: colors.border.default },

    monthSection: { gap: spacing[2] },
    monthLabel: {
        fontSize:          fontSize[12],
        fontWeight:        fontWeight.bold,
        color:             colors.text.quaternary,
        textTransform:     'uppercase',
        letterSpacing:     0.8,
        paddingHorizontal: spacing[1],
    },
    monthCards: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        overflow:        'hidden',
    },

    weekCard:       { borderBottomWidth: 1, borderBottomColor: colors.border.light },
    weekCardHeader: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[3],
    },
    weekCardLeft:    { flex: 1 },
    weekCardRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    weekRange:       { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.primary },
    weekDaysLogged:  { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: 2 },
    weekAvg:         { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.3 },

    trendChip: {
        paddingHorizontal: spacing[2],
        paddingVertical:   2,
        borderRadius:      radius[1],
        minWidth:          40,
        alignItems:        'center',
    },
    trendChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },

    dayList: { paddingBottom: spacing[2] },
    dayRow: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[2],
        paddingLeft:       spacing[8],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    dayRowLast:  { borderBottomWidth: 0 },
    dayLabel:    { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    dayWeight:   { fontSize: fontSize[12], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.3 },
}));

export default WeightHistoryScreen;