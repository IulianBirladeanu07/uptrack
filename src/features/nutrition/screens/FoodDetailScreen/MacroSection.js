import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const MacroSection = ({ totalCalories, protein, carbs, fat }) => (
  <View style={styles.container}>
    <View style={styles.calorieContainer}>
      <Text style={styles.calorieValue}>{totalCalories}</Text>
      <Text style={styles.calorieUnit}>calories</Text>
    </View>

    <View style={styles.macrosContainer}>
      <View style={[styles.macroItem, styles.proteinContainer]}>
        <View style={[styles.macroIconDot, { backgroundColor: colors.macro.protein }]} />
        <Text style={styles.label}>Protein</Text>
        <Text style={[styles.value, { color: colors.macro.protein }]}>{protein.toFixed(1)} g</Text>
      </View>

      <View style={[styles.macroItem, styles.carbsContainer]}>
        <View style={[styles.macroIconDot, { backgroundColor: colors.macro.carbs }]} />
        <Text style={styles.label}>Carbs</Text>
        <Text style={[styles.value, { color: colors.macro.carbs }]}>{carbs.toFixed(1)} g</Text>
      </View>

      <View style={[styles.macroItem, styles.fatContainer]}>
        <View style={[styles.macroIconDot, { backgroundColor: colors.macro.fat }]} />
        <Text style={styles.label}>Fat</Text>
        <Text style={[styles.value, { color: colors.macro.fat }]}>{fat.toFixed(1)} g</Text>
      </View>
    </View>
  </View>
);

const styles = createStyles(() => ({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 18,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  calorieContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    paddingBottom: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  calorieValue: {
    fontSize: fontSize[56],
    fontWeight: fontWeight.extrabold,
    color: colors.accent.primary,
    letterSpacing: -2,
  },
  calorieUnit: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    marginTop: spacing[1],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius[3],
    borderWidth: 1,
  },
  macroIconDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radius[1],
    marginBottom: spacing[3],
  },
  proteinContainer: {
    backgroundColor: colors.faded.protein,
    borderColor: colors.border.protein,
  },
  carbsContainer: {
    backgroundColor: colors.faded.carbs,
    borderColor: colors.border.carbs,
  },
  fatContainer: {
    backgroundColor: colors.faded.fat,
    borderColor: colors.border.fat,
  },
  label: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    marginBottom: spacing[2],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.2,
  },
}));

export default React.memo(MacroSection);