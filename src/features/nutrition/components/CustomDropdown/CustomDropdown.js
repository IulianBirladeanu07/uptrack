import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
  background: '#0F172A',
  surface: 'rgba(30, 41, 59, 0.5)',
  surfaceLight: 'rgba(15, 23, 42, 0.5)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#999999',
  textInactive: 'rgba(148, 163, 184, 0.4)',
  primary: '#FF8535',
  primaryDark: '#F97316',
  primaryLight: '#FFBC7D',
  primaryTransparent: 'rgba(255, 133, 53, 0.08)',
  primaryBorder: 'rgba(255, 133, 53, 0.3)',
  accent2: '#06B6D4',
  accent2Transparent: 'rgba(6, 182, 212, 0.05)',
  accent2Border: 'rgba(6, 182, 212, 0.5)',
  accent3: '#EF4444',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.05)',
  inputBackground: 'rgba(30, 41, 59, 0.5)',
  inputBorder: 'rgba(71, 85, 105, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const CustomDropdown = ({ options, onSelect, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getIconForOption = (value) => {
    switch (value) {
      case 'edit':
        return 'pencil-outline';
      case 'delete':
        return 'trash-outline';
      case 'history':
        return 'time-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getColorForOption = (value) => {
    switch (value) {
      case 'delete':
        return COLORS.accent3;
      case 'history':
        return COLORS.accent2;
      default:
        return COLORS.text;
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
            <Ionicons
              name={getIconForOption(option.value)}
              size={normalize(18)}
              color={getColorForOption(option.value)}
              style={styles.dropdownIcon}
            />
            <Text
              style={[
                styles.dropdownItemText,
                { color: getColorForOption(option.value) },
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)', // More opaque for better readability
    borderRadius: normalize(14),
    width: normalize(190),
    paddingVertical: normalize(4),
    elevation: 12,
    top: normalize(50),
    right: normalize(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    backdropFilter: 'blur(10px)', // For iOS blur effect
  },
  dropdownArrow: {
    position: 'absolute',
    top: normalize(-6),
    right: normalize(28),
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: normalize(8),
    borderRightWidth: normalize(8),
    borderBottomWidth: normalize(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(30, 41, 59, 0.95)',
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
  },
  dropdownItemFirst: {
    borderTopLeftRadius: normalize(14),
    borderTopRightRadius: normalize(14),
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: normalize(14),
    borderBottomRightRadius: normalize(14),
  },
  dropdownIcon: {
    marginRight: normalize(12),
  },
  dropdownItemText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.2,
    flex: 1,
  },
});

export default CustomDropdown;