import { useState, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        paddingHorizontal: spacing[3],
        paddingTop: spacing[2],
        paddingBottom: spacing[24],
    },
    card: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    title: {
        flex: 1,
        fontSize: fontSize[24],
        fontWeight: fontWeight.extrabold,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    editLink: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
        marginLeft: spacing[3],
        marginTop: spacing[1],
    },
    statsMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginTop: spacing[2],
        marginBottom: spacing[3],
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    metaText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    muscleGroupsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    muscleChip: {
        backgroundColor: colors.faded.surface,
        borderRadius: radius[5],
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[3],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    muscleChipText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
    },
    noteLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: spacing[1],
    },
    noteText: {
        fontSize: fontSize[14],
        color: colors.text.primary,
        lineHeight: 20,
        marginBottom: spacing[4],
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        gap: spacing[2],
    },
    exerciseRowLast: {
        borderBottomWidth: 0,
    },
    exerciseSets: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.accent.primary,
        width: spacing[6],
    },
    exerciseInfo: {
        flex: 1,
        gap: 2,
    },
    exerciseNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[2],
    },
    exerciseName: {
        flex: 1,
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    exerciseReps: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    exerciseSubMeta: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    exerciseNoteContainer: {
        marginTop: spacing[2],
        marginBottom: spacing[2],
        paddingTop: spacing[2],
        paddingLeft: spacing[8],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    exerciseNoteText: {
        fontSize: fontSize[12],
        color: colors.text.primary,
        lineHeight: 18,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[10],
    },
    emptyText: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        marginTop: spacing[3],
    },
}));

const formatRestTime = (seconds) => {
    if (!seconds) return '3m';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return remaining === 0 ? `${minutes}m` : `${minutes}m ${remaining}s`;
};

const ReviewStep = memo(({
    templateName = 'Untitled Workout',
    setCurrentStep = () => {},
    exercises = [],
    note = '',
    duration = 0,
}) => {
    const totalSets = exercises.reduce((sum, ex) => sum + parseInt(ex?.numSets || 0), 0);
    const muscleGroups = [...new Set(exercises.map(ex => ex?.muscleGroup || '').filter(Boolean))];

    const [expandedExercise, setExpandedExercise] = useState(null);

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{templateName}</Text>
                    <TouchableOpacity onPress={() => setCurrentStep(1)} activeOpacity={0.7}>
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="barbell-outline" size={12} color={colors.text.quaternary} />
                        <Text style={styles.metaText}>{exercises.length} exercises</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                        <Text style={styles.metaText}>{totalSets} sets</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={colors.text.quaternary} />
                        <Text style={styles.metaText}>{duration}m</Text>
                    </View>
                </View>

                {muscleGroups.length > 0 && (
                    <View style={styles.muscleGroupsList}>
                        {muscleGroups.map((muscle, idx) => (
                            <View key={idx} style={styles.muscleChip}>
                                <Text style={styles.muscleChipText}>{muscle}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {note ? (
                    <View>
                        <Text style={styles.noteLabel}>Note</Text>
                        <Text style={styles.noteText}>{note}</Text>
                    </View>
                ) : null}

                {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={spacing[9]} color={colors.text.quaternary} />
                        <Text style={styles.emptyText}>No exercises added yet</Text>
                    </View>
                ) : (
                    exercises.map((exercise, index) => {
                        const name = exercise?.name || exercise?.exerciseName || 'Unnamed Exercise';
                        const muscleGroup = exercise?.muscleGroup || 'N/A';
                        const isExpanded = expandedExercise === index;
                        const hasNote = exercise?.note || exercise?.notes;
                        const isLast = index === exercises.length - 1;

                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => hasNote && setExpandedExercise(isExpanded ? null : index)}
                                activeOpacity={hasNote ? 0.7 : 1}
                            >
                                <View style={[styles.exerciseRow, isLast && !isExpanded && styles.exerciseRowLast]}>
                                    <Text style={styles.exerciseSets}>{exercise?.numSets || 0}x</Text>
                                    <View style={styles.exerciseInfo}>
                                        <View style={styles.exerciseNameRow}>
                                            <Text style={styles.exerciseName} numberOfLines={1}>{name}</Text>
                                            <Text style={styles.exerciseReps}>{exercise?.repRange || ''}</Text>
                                        </View>
                                        <Text style={styles.exerciseSubMeta}>
                                            {muscleGroup} · {formatRestTime(exercise?.restTime)} rest
                                        </Text>
                                    </View>
                                    {hasNote && (
                                        <Ionicons
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={spacing.iconSm}
                                            color={colors.text.secondary}
                                        />
                                    )}
                                </View>
                                {isExpanded && hasNote && (
                                    <View style={styles.exerciseNoteContainer}>
                                        <Text style={styles.exerciseNoteText}>{exercise.note || exercise.notes}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
});

export default ReviewStep;