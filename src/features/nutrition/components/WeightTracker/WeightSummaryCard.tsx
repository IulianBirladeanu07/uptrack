import { Text, View } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

type WeightSummaryCardProps = {
    currentWeight: number | null;
    loggedCount: number;
    startWeight: number | null;
    goalWeight: number | null;
    progressPercent: number;
    lastWeekAverage: number | null;
    weeklyAverage: number | null;
    remaining: number | null;
    isBulking: boolean;
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
    isBulking,
}: WeightSummaryCardProps) => {
    const lastWeekDisplay = lastWeekAverage != null ? parseFloat(lastWeekAverage.toFixed(1)) : null;
    const weeklyDisplay = weeklyAverage != null ? parseFloat(weeklyAverage.toFixed(1)) : null;
    const weekChangeColor = weeklyDisplay != null && lastWeekDisplay != null
        ? (isBulking
            ? (weeklyDisplay >= lastWeekDisplay ? colors.accent.success : colors.accent.error)
            : (weeklyDisplay <= lastWeekDisplay ? colors.accent.success : colors.accent.error))
        : colors.text.primary;
    const weekChangeDelta = weeklyDisplay != null && lastWeekDisplay != null
        ? parseFloat((weeklyDisplay - lastWeekDisplay).toFixed(1))
        : null;

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
                    <Text style={styles.statValue}>{lastWeekAverage != null ? lastWeekAverage.toFixed(1) : '--'}</Text>
                    <Text style={styles.statLabel}>Last Week</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statValue}>{weeklyAverage != null ? weeklyAverage.toFixed(1) : '--'}</Text>
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
                    <Text style={styles.statValue}>{remaining != null ? remaining.toFixed(1) : '--'}</Text>
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
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    statLabel: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, height: spacing[8], backgroundColor: colors.border.default, marginTop: 2 },
    deltaChip: { paddingHorizontal: spacing[1], paddingVertical: 1, borderRadius: radius[1], alignItems: 'center', marginLeft: spacing[1] },
    deltaChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },
}));

export default WeightSummaryCard;
