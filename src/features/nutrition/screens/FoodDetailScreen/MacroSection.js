import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.08)',
  // Macro colors matching the app theme
  protein: '#A78BFA',
  proteinBg: 'rgba(167, 139, 250, 0.1)',
  carbs: '#34D399',
  carbsBg: 'rgba(52, 211, 153, 0.1)',
  fat: '#60A5FA',
  fatBg: 'rgba(96, 165, 250, 0.1)',
};

const MacroSection = ({ totalCalories, protein, carbs, fat }) => {
  return (
    <View style={styles.container}>
      <View style={styles.calorieContainer}>
        <Text style={styles.calorieValue}>{totalCalories}</Text>
        <Text style={styles.calorieUnit}>calories</Text>
      </View>
      
      <View style={styles.macrosContainer}>
        <View style={[styles.macroItem, styles.proteinContainer]}>
          <View style={[styles.macroIconDot, { backgroundColor: COLORS.protein }]} />
          <Text style={styles.label}>Protein</Text>
          <Text style={[styles.value, { color: COLORS.protein }]}>{protein.toFixed(1)} g</Text>
        </View>
        
        <View style={[styles.macroItem, styles.carbsContainer]}>
          <View style={[styles.macroIconDot, { backgroundColor: COLORS.carbs }]} />
          <Text style={styles.label}>Carbs</Text>
          <Text style={[styles.value, { color: COLORS.carbs }]}>{carbs.toFixed(1)} g</Text>
        </View>
        
        <View style={[styles.macroItem, styles.fatContainer]}>
          <View style={[styles.macroIconDot, { backgroundColor: COLORS.fat }]} />
          <Text style={styles.label}>Fat</Text>
          <Text style={[styles.value, { color: COLORS.fat }]}>{fat.toFixed(1)} g</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: normalize(18),
    padding: normalize(20),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calorieContainer: {
    alignItems: 'center',
    marginBottom: normalize(24),
    paddingBottom: normalize(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  calorieValue: {
    fontSize: normalize(56),
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -2,
  },
  calorieUnit: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    marginTop: normalize(4),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(12),
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    padding: normalize(16),
    borderRadius: normalize(14),
    borderWidth: 1,
    position: 'relative',
  },
  macroIconDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    marginBottom: normalize(10),
  },
  proteinContainer: {
    backgroundColor: COLORS.proteinBg,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  carbsContainer: {
    backgroundColor: COLORS.carbsBg,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  fatContainer: {
    backgroundColor: COLORS.fatBg,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  label: {
    fontSize: normalize(12),
    color: COLORS.textSecondary,
    marginBottom: normalize(6),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: normalize(18),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default React.memo(MacroSection);