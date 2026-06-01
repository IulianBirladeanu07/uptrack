import { Text, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const PreviousSetDisplay = ({ previousSetData, onPress, setIndex, isCompleted }) => {
  const hasPreviousData = previousSetData && (previousSetData.weight || previousSetData.reps);
  return (
    <TouchableOpacity
      style={styles.previousContainer}
      onPress={() => onPress(setIndex)}
      disabled={!hasPreviousData}
      activeOpacity={0.7}
      hitSlop={{ top: spacing[5], bottom: spacing[5], left: spacing[5], right: spacing[5] }}
    >
      {hasPreviousData ? (
        <Text style={[styles.previousText, isCompleted && styles.previousTextCompleted]}>
          {previousSetData.weight || '0'}kg ×{previousSetData.reps || '0'}
        </Text>
      ) : (
        <Text style={styles.emptyStateText}>—</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = createStyles(() => ({
  previousContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previousText: {
    color: colors.text.quaternary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  previousTextCompleted: {
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
}));


PreviousSetDisplay.whyDidYouRender = true;
export default PreviousSetDisplay;