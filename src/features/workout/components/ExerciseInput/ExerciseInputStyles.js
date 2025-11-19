import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  
  text: '#F9FAFB',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInactive: 'rgba(156, 163, 175, 0.4)',
  
  primary: '#FF9500',
  primaryTransparent: 'rgba(255, 149, 0, 0.15)',
  primaryBorder: 'rgba(255, 149, 0, 0.3)',
  
  cyan: '#06B6D4',
  cyanTransparent: 'rgba(6, 182, 212, 0.08)',
  cyanBorder: 'rgba(6, 182, 212, 0.4)',
  cyanGlow: 'rgba(6, 182, 212, 0.25)',
  cyanFocusBg: 'rgba(6, 182, 212, 0.08)',
  cyanCompletedBorder: 'rgba(6, 182, 212, 0.35)',
  cyanCompletedBg: 'rgba(6, 182, 212, 0.06)',
  accent2: '#06B6D4',
  accent2Transparent: 'rgba(6, 182, 212, 0.15)',
  accent2Border: 'rgba(6, 182, 212, 0.3)',
  
  danger: '#FF453A',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  
  inputBg: 'rgba(31, 41, 55, 0.5)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
};

export const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: normalize(18),
    marginHorizontal: normalize(12),
    marginBottom: normalize(20),
    overflow: 'hidden',
  },
  
  dataGrid: {
    backgroundColor: 'transparent',
  },
  
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  
  gridHeaderText: {
    fontSize: normalize(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  gridHeaderSet: {
    width: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  gridHeaderPrev: {
    width: normalize(90),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  
  gridHeaderWeight: {
    width: normalize(90),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  
  gridHeaderReps: {
    width: normalize(90),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  
  gridHeaderStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  holoAddBtn: {
    marginHorizontal: normalize(16),
    marginVertical: normalize(16),
    backgroundColor: COLORS.primaryTransparent,
    borderColor: COLORS.primaryBorder,
    borderWidth: 1,
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(12),
  },
  
  holoAddBtnText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  
  errorText: {
    color: COLORS.danger,
    fontSize: normalize(14),
    padding: normalize(16),
    textAlign: 'center',
  },
});