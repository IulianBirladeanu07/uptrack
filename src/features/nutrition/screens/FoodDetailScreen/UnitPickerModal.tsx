import { memo } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const UNIT_LABELS: Record<string, string> = {
  g: 'Grams',
  ml: 'Milliliters',
  oz: 'Ounces',
  mL: 'Milliliters',
  cup: 'Cups',
  serving: 'Servings',
};

type UnitPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  units: readonly string[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
};

const UnitPickerModal = ({ visible, onClose, units, selectedUnit, onSelectUnit }: UnitPickerModalProps) => {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="unit-picker-backdrop"
      >
        <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheet, { paddingBottom: spacing[7] + insets.bottom }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Serving unit</Text>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel unit selection"
                  hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.options}
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
                    accessibilityRole="button"
                    accessibilityLabel={`${UNIT_LABELS[unit] || unit} (${unit})`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.unitLabel, isSelected && styles.unitLabelSelected]}>
                      {UNIT_LABELS[unit] || unit} ({unit})
                    </Text>
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
    borderTopLeftRadius: radius[5],
    borderTopRightRadius: radius[5],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.default,
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
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  cancelText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.accent.primary,
  },
  scrollView: {
    flexGrow: 0,
  },
  options: {
    paddingBottom: spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    minHeight: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionSelected: {
    backgroundColor: colors.faded.primaryLight,
  },
  unitLabel: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  unitLabelSelected: {
    color: colors.accent.primary,
  },
}));

export default memo(UnitPickerModal);