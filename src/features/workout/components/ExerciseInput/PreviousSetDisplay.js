import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './ExerciseInputStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const PreviousSetDisplay = ({ previousSetData, onPress, setIndex, isCompleted }) => {
  const hasPreviousData = previousSetData && (previousSetData.weight || previousSetData.reps);

  return (
    <TouchableOpacity
      style={styles.previousContainer}
      onPress={() => onPress(setIndex)}
      disabled={!hasPreviousData}
      activeOpacity={0.7}
      hitSlop={{ top: normalize(20), bottom: normalize(20), left: normalize(20), right: normalize(20) }}
    >
      {hasPreviousData ? (
        <Text style={[
          styles.previousText,
          isCompleted && styles.previousTextCompleted
        ]}>
          {previousSetData.weight || '0'}kg ×{previousSetData.reps || '0'}
        </Text>
      ) : (
        <Text style={styles.emptyStateText}>—</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  previousContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previousText: {
    color: COLORS.textMuted,
    fontSize: normalize(13),
    fontWeight: '500',
    textAlign: 'center',
  },
  previousTextCompleted: {
    opacity: 0.5,
  },
  emptyStateText: {
    color: COLORS.textInactive,
    fontSize: normalize(12),
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default PreviousSetDisplay;