import { Pressable, Text, View } from 'react-native';
import { useFoodContext } from '../../../features/nutrition/context/FoodContext';
import { colors, fontSize, fontWeight, spacing } from '../../theme';
import { createStyles } from '../../theme/createStyles';

const PendingMealWritesBanner = () => {
  const { pendingMealWriteCount, retryPendingMealWrites } = useFoodContext();
  if (pendingMealWriteCount === 0) return null;

  return (
    <View style={styles.bar} accessibilityRole="summary">
      <Text style={styles.text}>
        {pendingMealWriteCount === 1 ? '1 meal change is waiting to sync' : `${pendingMealWriteCount} meal changes are waiting to sync`}
      </Text>
      <Pressable onPress={() => { void retryPendingMealWrites(); }} accessibilityRole="button" accessibilityLabel="Retry meal sync">
        <Text style={styles.action}>Retry</Text>
      </Pressable>
    </View>
  );
};

const styles = createStyles(() => ({
  bar: {
    minHeight: 42,
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  text: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
  },
  action: {
    color: colors.accent.primary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
  },
}));

export default PendingMealWritesBanner;
