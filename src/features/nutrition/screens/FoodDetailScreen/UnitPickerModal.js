import React from 'react';
import { Modal, Pressable, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  primary: '#FF9500',
  border: 'rgba(255, 255, 255, 0.08)',
  primaryBg: 'rgba(255, 149, 0, 0.15)',
  primaryBorder: 'rgba(255, 149, 0, 0.3)',
  primaryTransparent: 'rgba(255, 149, 0, 0.1)',
};

const UnitPickerModal = ({ visible, onClose, units, selectedUnit, onSelectUnit }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
        {/* Handle bar */}
        <View style={styles.handleBar} />
        
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="scale" size={normalize(20)} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Serving Unit</Text>
          </View>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={normalize(22)} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {units.map((unit, index) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.modalOption,
                unit === selectedUnit && styles.modalOptionSelected,
                index === units.length - 1 && styles.lastOption
              ]}
              onPress={() => onSelectUnit(unit)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  unit === selectedUnit && styles.radioOuterSelected
                ]}>
                  {unit === selectedUnit && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.modalOptionText,
                  unit === selectedUnit && styles.modalOptionTextSelected
                ]}>
                  {unit}
                </Text>
              </View>
              {unit === selectedUnit && (
                <View style={styles.checkmarkContainer}>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={normalize(20)} 
                    color={COLORS.primary} 
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 19, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    maxHeight: '60%',
    paddingBottom: normalize(20),
  },
  handleBar: {
    width: normalize(40),
    height: normalize(4),
    backgroundColor: COLORS.textTertiary,
    borderRadius: normalize(2),
    alignSelf: 'center',
    marginTop: normalize(12),
    marginBottom: normalize(8),
    opacity: 0.4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(12),
    paddingBottom: normalize(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  iconBadge: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(14),
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  modalTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  modalCloseButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(8),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: normalize(14),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(16),
    marginBottom: normalize(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.primaryTransparent,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  lastOption: {
    marginBottom: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  radioOuter: {
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTransparent,
  },
  radioInner: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: normalize(16),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalOptionTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  checkmarkContainer: {
    marginLeft: normalize(8),
  },
});

export default React.memo(UnitPickerModal);