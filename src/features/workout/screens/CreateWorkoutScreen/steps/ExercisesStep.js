import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import ExerciseItem from '../../../components/ExerciseItem/ExerciseItem';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

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
  scrollViewRef 
}) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: normalize(10) }}
    >
      <View style={styles.exercisesCard}>
        <View style={styles.exerciseHeaderRow}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <View style={styles.exerciseCount}>
            <Text style={styles.exerciseCountText}>{exercises.length} total</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {exercises.length > 0 ? (
          <View style={styles.exercisesList}>
            {exercises.map((exercise, index) => (
              exercise && (
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
              )
            ))}
          </View>
        ) : (
          <View style={styles.emptyExerciseContainer}>
            <Feather name="clipboard" size={36} color={COLORS.textSecondary} />
            <Text style={styles.emptyExerciseText}>
              No exercises added yet.{'\n'}Start building your workout!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={handleAddExercise}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={COLORS.bg} />
          <Text style={styles.addExerciseButtonText}>ADD EXERCISE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  exercisesCard: {
    backgroundColor: 'transparent',
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(6),
    paddingHorizontal: normalize(12),
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  exerciseCount: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
  },
  exerciseCountText: {
    fontSize: normalize(10),
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  exercisesList: {
    // No specific styles needed - container for ExerciseItem components
  },
  emptyExerciseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
  },
  emptyExerciseText: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: normalize(12),
    lineHeight: normalize(20),
    maxWidth: '80%',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: normalize(12),
    paddingVertical: normalize(15),
    marginTop: normalize(20),
    marginHorizontal: normalize(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addExerciseButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.bg,
    marginLeft: normalize(8),
  },
});

export default ExercisesStep;