import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const formatDate = (d) => {
    const val = d instanceof Date && !isNaN(d) ? d : new Date(d);
    if (val.toDateString() === new Date().toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (val.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return val.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const groupByMonth = (entries) => {
    const groups = {};
    entries.forEach(entry => {
        const d = new Date(entry.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
    });
    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, entries]) => ({ key, label: formatMonth(key + '-01'), entries }));
};

const EntryRow = ({ entry, isLast, isBulking }) => {
    const hasChange   = Math.abs(entry.change) > 0.05;
    const isGain      = entry.change > 0;
    const isPositive  = isBulking ? isGain : !isGain;
    const changeColor = isPositive ? colors.accent.success : colors.accent.error;
    const changeLabel = `${isGain ? '+' : ''}${entry.change.toFixed(1)}`;

    return (
        <View style={[styles.entryRow, isLast && styles.entryRowLast]}>
            <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
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

const WeightHistoryScreen = ({ route }) => {
    const navigation = useNavigation();
    const { entries = [], isBulking = false } = route.params ?? {};

    const grouped = useMemo(() => groupByMonth(entries), [entries]);

    const stats = useMemo(() => {
        if (!entries.length) return null;
        const weights = entries.map(e => e.weight);
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        return { min, max, avg };
    }, [entries]);

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter} pointerEvents="none">
                    <Text style={styles.headerTitle}>Weight History</Text>
                    <Text style={styles.headerSubtitle}>{entries.length} entries</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {stats && (
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.accent.success }]}>{stats.min.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>MIN</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.avg.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>AVG</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.accent.error }]}>{stats.max.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>MAX</Text>
                        </View>
                    </View>
                )}

                {grouped.map(group => (
                    <View key={group.key} style={styles.monthSection}>
                        <View style={styles.monthHeader}>
                            <Text style={styles.monthLabel}>{group.label}</Text>
                            <Text style={styles.monthCount}>{group.entries.length} entries</Text>
                        </View>
                        <View style={styles.monthCard}>
                            {group.entries.map((entry, i) => (
                                <EntryRow
                                    key={entry.id ?? `${entry.date}-${i}`}
                                    entry={entry}
                                    isLast={i === group.entries.length - 1}
                                    isBulking={isBulking}
                                />
                            ))}
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
        position:  'absolute',
        left:      0,
        right:     0,
        alignItems: 'center',
        gap:       2,
    },
    headerTitle:    { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
    headerSubtitle: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },

    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },

    statsCard: {
        flexDirection:   'row',
        alignItems:      'center',
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        paddingVertical: spacing[4],
    },
    statItem:    { flex: 1, alignItems: 'center', gap: spacing[1] },
    statValue:   { fontSize: fontSize[20], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    statLabel:   { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary, letterSpacing: 0.8 },
    statDivider: { width: 1, height: spacing[8], backgroundColor: colors.border.default },

    monthSection: { gap: spacing[2] },
    monthHeader: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[1],
    },
    monthLabel: { fontSize: fontSize[14], fontWeight: fontWeight.bold, color: colors.text.primary },
    monthCount: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },

    monthCard: {
        backgroundColor: colors.background.secondary,
        borderRadius:    radius[4],
        borderWidth:     1,
        borderColor:     colors.border.default,
        overflow:        'hidden',
    },
    entryRow: {
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical:   spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    entryRowLast:    { borderBottomWidth: 0 },
    entryDate:       { flex: 1, fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.secondary },
    entryWeightRow: { flexDirection: 'row', alignItems: 'center', marginRight: spacing[3] },
    entryWeight:     { fontSize: fontSize[14], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    entryWeightUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    deltaPillText:   { fontSize: fontSize[12], fontWeight: fontWeight.bold, minWidth: 36, textAlign: 'right' },
    deltaNeutral:    { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.quaternary, minWidth: 36, textAlign: 'right' },
}));

export default WeightHistoryScreen;