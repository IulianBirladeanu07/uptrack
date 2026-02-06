import React from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const UNIT_LABELS = {
  g: 'Grams',
  oz: 'Ounces',
  mL: 'Milliliters',
  cup: 'Cups',
  serving: 'Servings',
};

const UnitPickerModal = ({ visible, onClose, units, selectedUnit, onSelectUnit }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheet, { paddingBottom: spacing[7] + insets.bottom }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Serving Unit</Text>
              <Text style={styles.subtitle}>Select your preferred measurement</Text>
            </View>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {units.map((unit) => {
                const isSelected = unit === selectedUnit;
                
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => onSelectUnit(unit)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.textContent}>
                      <Text style={[styles.unitLabel, isSelected && styles.unitLabelSelected]}>
                        {UNIT_LABELS[unit] || unit}
                      </Text>
                      <Text style={[styles.unitCode, isSelected && styles.unitCodeSelected]}>
                        {unit}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={normalize(18)}
                        color={colors.accent.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = createStyles(() => ({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    maxHeight: '60%',
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius[4],
    borderTopRightRadius: radius[4],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  handle: {
    width: spacing[10],
    height: spacing[1],
    backgroundColor: colors.text.quaternary,
    borderRadius: radius[1],
    alignSelf: 'center',
    marginBottom: spacing[4],
    opacity: 0.5,
  },
  header: {
    marginBottom: spacing[4],
  },
  title: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  scrollView: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.faded.surfaceLight,
    borderRadius: radius[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[2],
    minHeight: spacing[14],
  },
  optionSelected: {
    backgroundColor: colors.faded.primary,
    borderColor: colors.border.primary,
  },
  textContent: {
    flex: 1,
  },
  unitLabel: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
    letterSpacing: -0.2,
  },
  unitLabelSelected: {
    color: colors.text.primary,
  },
  unitCode: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  unitCodeSelected: {
    color: colors.text.secondary,
  },
}));

export default React.memo(UnitPickerModal);