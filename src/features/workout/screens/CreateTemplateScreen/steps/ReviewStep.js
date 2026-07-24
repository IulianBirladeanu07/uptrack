import { useState, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        paddingHorizontal: spacing[3],
        paddingBottom: spacing[24],
    },
    headerSection: {
        marginTop: spacing[2],
        marginBottom: spacing[5],
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: spacing[12],
        height: spacing[12],
        borderRadius: radius[3],
        backgroundColor: colors.faded.primary,
        borderWidth: 1,
        borderColor: colors.border.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[3],
    },
    headerTitle: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    headerSubtitle: {
        fontSize: fontSize[12],
        color: colors.text.secondary,
        fontWeight: fontWeight.medium,
    },
    statsCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        marginBottom: spacing[3],
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing[2],
        marginBottom: spacing[1],
    },
    statLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    muscleGroupsCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        marginBottom: spacing[3],
    },
    sectionLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: spacing[2],
    },
    muscleGroupsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
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
        color: colors.text.primary,
    },
    noteCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        marginBottom: spacing[3],
    },
    noteText: {
        fontSize: fontSize[14],
        color: colors.text.primary,
        lineHeight: 20,
    },
    exercisesSection: {
        marginTop: spacing[2],
    },
    exercisesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    exercisesTitle: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        backgroundColor: colors.faded.surface,
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[3],
        borderRadius: radius[2],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    editButtonText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[15],
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    emptyText: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        marginTop: spacing[3],
    },
    exercisesList: {
        gap: spacing[2],
    },
    exerciseCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        padding: spacing[3],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exerciseImageContainer: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[2],
        backgroundColor: colors.faded.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[3],
        padding: spacing[1],
    },
    exerciseImage: {
        width: '100%',
        height: '100%',
        borderRadius: radius[2],
    },
    exerciseName: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    exerciseMetaText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
    },
    metaSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.quaternary,
        marginHorizontal: spacing[1],
    },
    exerciseNoteContainer: {
        marginTop: spacing[3],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    exerciseNoteText: {
        fontSize: fontSize[12],
        color: colors.text.primary,
        lineHeight: 18,
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
    const avgRestTime = exercises.length
        ? Math.round(exercises.reduce((sum, ex) => sum + parseInt(ex?.restTime || 180), 0) / exercises.length)
        : 180;
    const muscleGroups = [...new Set(exercises.map(ex => ex?.muscleGroup || '').filter(Boolean))];

    const [expandedExercise, setExpandedExercise] = useState(null);

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
            <View style={styles.headerSection}>
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={spacing.iconLg} color={colors.accent.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{templateName}</Text>
                        <Text style={styles.headerSubtitle}>Review your workout</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Ionicons name="fitness" size={spacing.iconMd} color={colors.accent.primary} />
                        <Text style={styles.statValue}>{exercises.length}</Text>
                        <Text style={styles.statLabel}>Exercises</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="repeat" size={spacing.iconMd} color={colors.accent.cyan} />
                        <Text style={styles.statValue}>{totalSets}</Text>
                        <Text style={styles.statLabel}>Total Sets</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="time" size={spacing.iconMd} color={colors.accent.successAlt} />
                        <Text style={styles.statValue}>{duration}m</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="timer" size={spacing.iconMd} color={colors.accent.purple} />
                        <Text style={styles.statValue}>{formatRestTime(avgRestTime)}</Text>
                        <Text style={styles.statLabel}>Avg Rest</Text>
                    </View>
                </View>
            </View>

            {muscleGroups.length > 0 && (
                <View style={styles.muscleGroupsCard}>
                    <Text style={styles.sectionLabel}>Target Muscles</Text>
                    <View style={styles.muscleGroupsList}>
                        {muscleGroups.map((muscle, idx) => (
                            <View key={idx} style={styles.muscleChip}>
                                <Text style={styles.muscleChipText}>{muscle}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {note ? (
                <View style={styles.noteCard}>
                    <Text style={styles.sectionLabel}>Workout Note</Text>
                    <Text style={styles.noteText}>{note}</Text>
                </View>
            ) : null}

            <View style={styles.exercisesSection}>
                <View style={styles.exercisesHeader}>
                    <Text style={styles.exercisesTitle}>Exercise List</Text>
                    <TouchableOpacity style={styles.editButton} onPress={() => setCurrentStep(1)} activeOpacity={0.7}>
                        <Ionicons name="create-outline" size={spacing.iconSm} color={colors.accent.primary} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={spacing[12]} color={colors.text.quaternary} />
                        <Text style={styles.emptyText}>No exercises added yet</Text>
                    </View>
                ) : (
                    <View style={styles.exercisesList}>
                        {exercises.map((exercise, index) => {
                            const name = exercise?.name || exercise?.exerciseName || 'Unnamed Exercise';
                            const muscleGroup = exercise?.muscleGroup || 'N/A';
                            const imageSource = exercise?.imageURL || exercise?.image
                                ? { uri: exercise.imageURL || exercise.image }
                                : null;
                            const isExpanded = expandedExercise === index;
                            const hasNote = exercise?.note || exercise?.notes;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.exerciseCard}
                                    onPress={() => hasNote && setExpandedExercise(isExpanded ? null : index)}
                                    activeOpacity={hasNote ? 0.7 : 1}
                                >
                                    <View style={styles.exerciseRow}>
                                        <View style={styles.exerciseImageContainer}>
                                            {imageSource ? (
                                                <Image source={imageSource} style={styles.exerciseImage} contentFit="cover" />
                                            ) : (
                                                <Ionicons name="barbell" size={spacing.iconMd} color={colors.text.quaternary} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.exerciseName} numberOfLines={1}>{name}</Text>
                                            <View style={styles.exerciseMeta}>
                                                <Text style={styles.exerciseMetaText}>{muscleGroup}</Text>
                                                {exercise?.numSets && exercise?.repRange && (
                                                    <>
                                                        <View style={styles.metaSeparator} />
                                                        <Text style={styles.exerciseMetaText}>{exercise.numSets} × {exercise.repRange}</Text>
                                                    </>
                                                )}
                                                {exercise?.restTime && (
                                                    <>
                                                        <View style={styles.metaSeparator} />
                                                        <Text style={styles.exerciseMetaText}>{formatRestTime(exercise.restTime)} rest</Text>
                                                    </>
                                                )}
                                            </View>
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
                                            <Text style={styles.sectionLabel}>Note</Text>
                                            <Text style={styles.exerciseNoteText}>{exercise.note || exercise.notes}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        </ScrollView>
    );
});

export default ReviewStep;