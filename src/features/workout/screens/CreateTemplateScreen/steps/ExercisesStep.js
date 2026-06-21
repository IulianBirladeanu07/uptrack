import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ExerciseItem from '../../../components/ExerciseItem/ExerciseItem';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    exerciseHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
        paddingHorizontal: spacing[3],
    },
    sectionTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        letterSpacing: 0.2,
    },
    exerciseCount: {
        backgroundColor: colors.faded.primary,
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[2],
        borderRadius: radius[2],
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    exerciseCountText: {
        fontSize: fontSize[10],
        color: colors.accent.primary,
        fontWeight: fontWeight.bold,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[15],
    },
    emptyText: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[3],
        lineHeight: 20,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent.primary,
        borderRadius: radius[3],
        paddingVertical: spacing[4],
        marginTop: spacing[5],
        marginHorizontal: spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    addExerciseButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.buttonText,
        marginLeft: spacing[2],
    },
}));

export const ExercisesStep = ({
    exercises,
    exerciseFadeAnims,
    handleAddExercise,
    handleSetsChange,
    handleRepsChange,
    handleDeleteExercise,
    handleNoteChange,
    handleReplaceExercise,
    handleRestBetweenSetsChange,
    scrollViewRef,
}) => {
    return (
        <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing[2] }}
        >
            <View style={styles.exerciseHeaderRow}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <View style={styles.exerciseCount}>
                    <Text style={styles.exerciseCountText}>{exercises.length} total</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {exercises.length > 0 ? (
                exercises.map((exercise, index) =>
                    exercise ? (
                        <ExerciseItem
                            key={`exercise-${index}-${exercise.exerciseName || exercise.name || Date.now()}`}
                            exercise={exercise}
                            index={index}
                            onSetsChange={handleSetsChange}
                            onRepsChange={handleRepsChange}
                            onNoteChange={handleNoteChange}
                            onReplace={handleReplaceExercise}
                            onDelete={handleDeleteExercise}
                            onRestBetweenSetsChange={handleRestBetweenSetsChange}
                            fadeAnim={exerciseFadeAnims[index]}
                        />
                    ) : null
                )
            ) : (
                <View style={styles.emptyContainer}>
                    <Feather name="clipboard" size={spacing[9]} color={colors.text.secondary} />
                    <Text style={styles.emptyText}>
                        No exercises added yet.{'\n'}Start building your workout!
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={handleAddExercise}
                activeOpacity={0.7}
            >
                <Feather name="plus" size={spacing.iconMd} color={colors.accent.buttonText} />
                <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default ExercisesStep;