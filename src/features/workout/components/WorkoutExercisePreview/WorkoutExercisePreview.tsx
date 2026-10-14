import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../../shared/theme';
import styles from './WorkoutExercisePreviewStyles';

type PreviewExercise = {
  numSets?: number | string | null;
  exerciseName?: string | null;
  repRange?: string | number | null;
};

type ExercisePreviewListProps = {
  exercises?: PreviewExercise[] | null | undefined;
};

type WorkoutExercisePreviewProps = {
  exercises?: PreviewExercise[] | null | undefined;
  activeWorkout?: boolean | null | undefined;
  onStart: () => void;
};

export const ExercisePreviewList = ({ exercises }: ExercisePreviewListProps) => {
  if (!exercises?.length) return null;

  return (
    <View style={styles.list}>
      {exercises.map((exercise, index) => (
        <View
          key={index}
          style={[styles.row, index === exercises.length - 1 && styles.rowLast]}
        >
          <Text style={styles.sets}>{exercise.numSets}x</Text>
          <Text style={styles.name} numberOfLines={1}>{exercise.exerciseName}</Text>
          <Text style={styles.reps}>{exercise.repRange}</Text>
        </View>
      ))}
    </View>
  );
};

const WorkoutExercisePreview = ({ exercises, activeWorkout, onStart }: WorkoutExercisePreviewProps) => (
  <>
    <ExercisePreviewList exercises={exercises} />
    <TouchableOpacity
      style={[styles.startButton, activeWorkout && styles.startButtonDisabled]}
      onPress={() => {
        if (activeWorkout) return;
        onStart();
      }}
      activeOpacity={0.8}
      disabled={!!activeWorkout}
    >
      {!activeWorkout && <Ionicons name="play" size={spacing.iconMd} color={colors.accent.buttonText} />}
      <Text style={[styles.startButtonText, activeWorkout && styles.startButtonTextDisabled]}>
        {activeWorkout ? 'Workout in Progress' : 'Start Workout'}
      </Text>
    </TouchableOpacity>
  </>
);

export default WorkoutExercisePreview;
