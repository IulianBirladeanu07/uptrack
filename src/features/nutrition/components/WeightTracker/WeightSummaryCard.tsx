import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PlanType } from '../../../../shared/types';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { getWeightTrendTone } from './weightTrackerPresentation';

type WeightSummaryCardProps = {
    currentWeight: number | null;
    loggedCount: number;
    startWeight: number | null;
    goalWeight: number | null;
    progressPercent: number;
    lastWeekAverage: number | null;
    weeklyAverage: number | null;
    remaining: number | null;
    planType: PlanType;
    goalReached: boolean;
    trendPhaseKnown: boolean;
};

const WeightSummaryCard = ({
    currentWeight,
    loggedCount,
    startWeight,
    goalWeight,
    progressPercent,
    lastWeekAverage,
    weeklyAverage,
    remaining,
    planType,
    goalReached,
    trendPhaseKnown,
}: WeightSummaryCardProps) => {
    const lastWeekDisplay = lastWeekAverage != null ? parseFloat(lastWeekAverage.toFixed(1)) : null;
    const weeklyDisplay = weeklyAverage != null ? parseFloat(weeklyAverage.toFixed(1)) : null;
    const weekChangeDelta = weeklyDisplay != null && lastWeekDisplay != null
        ? parseFloat((weeklyDisplay - lastWeekDisplay).toFixed(1))
        : null;
    const weekChangeTone = weekChangeDelta == null
        ? 'neutral'
        : getWeightTrendTone(weekChangeDelta, planType, trendPhaseKnown);
    const weekChangeColor = weekChangeTone === 'favorable'
        ? colors.accent.success
        : weekChangeTone === 'unfavorable'
            ? colors.accent.error
            : colors.text.quaternary;

    return (
        <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
                <Text style={styles.eyebrow}>Today's Weight</Text>
                {loggedCount > 0 && <Text style={styles.loggedCount}>{loggedCount}/7 logged</Text>}
            </View>

            <View style={styles.heroWeightRow}>
                <Text style={styles.heroWeight}>{currentWeight != null ? currentWeight.toFixed(1) : '--.-'}</Text>
                <Text style={styles.heroUnit}>kg</Text>
            </View>

            {startWeight != null && goalWeight != null ? (
                <View style={styles.progressSection}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressLabelSide}>{startWeight.toFixed(1)} kg</Text>
                        <Text style={styles.progressPercent}>
                            {goalReached ? 'Goal reached' : `${progressPercent.toFixed(0)}% to goal`}
                        </Text>
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
                    <Text style={styles.statValue}>{lastWeekAverage != null ? lastWeekAverage.toFixed(1) : '--'}</Text>
                    <Text style={styles.statLabel}>Last Week</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statValue}>{weeklyAverage != null ? weeklyAverage.toFixed(1) : '--'}</Text>
                        {weekChangeDelta != null && (
                            <View style={[styles.deltaChip, {
                                backgroundColor: weekChangeTone === 'favorable'
                                    ? colors.faded.successAlt
                                    : weekChangeTone === 'unfavorable'
                                        ? colors.faded.errorAlt
                                        : colors.faded.surface,
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
                    <View style={styles.statValueRow}>
                        {goalReached ? (
                            <View style={styles.reachedChip}>
                                <Ionicons name="checkmark" size={12} color={colors.accent.success} />
                                <Text style={styles.reachedChipText}>Goal reached</Text>
                            </View>
                        ) : (
                            <Text style={styles.statValue}>
                                {remaining != null ? remaining.toFixed(1) : '--'}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.statLabel}>To Goal</Text>
                </View>
            </View>
        </View>
    );
};

const styles = createStyles(() => ({
    heroCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing[5],
        marginTop: spacing[3],
    },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] },
    eyebrow: { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 1.2 },
    loggedCount: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
    heroWeightRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing[1], marginBottom: spacing[4] },
    heroWeight: { fontSize: fontSize[56], fontWeight: fontWeight.black, color: colors.text.primary, letterSpacing: -4, lineHeight: 64, includeFontPadding: false },
    heroUnit: { fontSize: fontSize[20], fontWeight: fontWeight.semibold, color: colors.text.secondary, marginBottom: spacing[2] },
    emptyHeroText: { fontSize: fontSize[12], color: colors.text.quaternary, marginBottom: spacing[4], textAlign: 'center' },
    progressSection: { marginBottom: spacing[2] },
    progressTrack: { height: 8, backgroundColor: colors.background.tertiary, borderRadius: radius[1], overflow: 'hidden', marginBottom: spacing[2] },
    progressFill: { height: '100%', backgroundColor: colors.accent.primary, borderRadius: radius[1] },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabelSide: { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary },
    progressPercent: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.secondary },
    statRow: { flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: colors.border.default, marginTop: spacing[3], paddingTop: spacing[3] },
    statCell: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    reachedChip: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius[2], backgroundColor: colors.faded.successAlt },
    reachedChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.accent.success, lineHeight: fontSize[14] },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    statLabel: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, height: spacing[8], backgroundColor: colors.border.default, marginTop: 2 },
    deltaChip: { paddingHorizontal: spacing[1], paddingVertical: 1, borderRadius: radius[1], alignItems: 'center', marginLeft: spacing[1] },
    deltaChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },
}));

export default WeightSummaryCard;
