import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
};

const NutrientRow = ({ label, value, unit = 'g', color = '#10B981' }) => (
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

const styles = StyleSheet.create({
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(14),
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  nutrientDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  nutrientLabel: {
    fontSize: normalize(15),
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nutrientValue: {
    fontSize: normalize(15),
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  unitText: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default React.memo(NutrientRow);