import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, radius, fontWeight, fontSize } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const NutrientRow = ({ label, value, unit = 'g', color = colors.accent.success }) => (
  <View style={styles.nutrientRow}>
    <View style={styles.leftContent}>
      <View style={[styles.nutrientDot, { backgroundColor: color }]} />
      <Text style={styles.nutrientLabel}>{label}</Text>
    </View>
    <Text style={styles.nutrientValue}>
      {value}<Text style={styles.unitText}> {unit}</Text>
    </Text>
  </View>
);

const styles = createStyles(() => ({
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  nutrientDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radius[1],
  },
  nutrientLabel: {
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  nutrientValue: {
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  unitText: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
}));

export default React.memo(NutrientRow);