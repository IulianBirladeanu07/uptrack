import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1C2128',
  
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  
  primary: '#FF9500',
  primaryTransparent: 'rgba(255, 149, 0, 0.15)',
  
  cyan: '#06B6D4',
  cyanTransparent: 'rgba(6, 182, 212, 0.15)',
  
  danger: '#FF453A',
  dangerTransparent: 'rgba(255, 69, 58, 0.15)',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const CustomDropdown = ({ options, onSelect, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getIconForOption = (value) => {
    switch (value) {
      case 'replace':
        return 'swap-horizontal-outline';
      case 'delete':
        return 'trash-outline';
      case 'history':
        return 'time-outline';
      case 'edit':
        return 'pencil-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getColorForOption = (value) => {
    switch (value) {
      case 'delete':
        return COLORS.danger;
      case 'history':
        return COLORS.cyan;
      case 'replace':
        return COLORS.primary;
      default:
        return COLORS.text;
    }
  };

  const getBackgroundForOption = (value) => {
    switch (value) {
      case 'delete':
        return COLORS.dangerTransparent;
      case 'history':
        return COLORS.cyanTransparent;
      case 'replace':
        return COLORS.primaryTransparent;
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.dropdown}>
        <View style={styles.dropdownArrow} />
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              onSelect(option.value);
            }}
            style={[
              styles.dropdownItem,
              index === 0 && styles.dropdownItemFirst,
              index === options.length - 1 && styles.dropdownItemLast,
            ]}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: getBackgroundForOption(option.value) }
            ]}>
              <Ionicons
                name={getIconForOption(option.value)}
                size={normalize(16)}
                color={getColorForOption(option.value)}
              />
            </View>
            <Text
              style={[
                styles.dropdownItemText,
                option.value === 'delete' && styles.dropdownItemTextDanger
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: normalize(12),
    width: normalize(190),
    paddingVertical: normalize(6),
    elevation: 12,
    top: normalize(48),
    right: normalize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownArrow: {
    position: 'absolute',
    top: normalize(-7),
    right: normalize(20),
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: normalize(8),
    borderRightWidth: normalize(8),
    borderBottomWidth: normalize(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.surface,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  dropdownItemFirst: {
    borderTopLeftRadius: normalize(12),
    borderTopRightRadius: normalize(12),
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: normalize(12),
    borderBottomRightRadius: normalize(12),
  },
  iconContainer: {
    width: normalize(30),
    height: normalize(30),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(10),
  },
  dropdownItemText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.1,
    flex: 1,
  },
  dropdownItemTextDanger: {
    color: COLORS.danger,
  },
});

export default CustomDropdown;