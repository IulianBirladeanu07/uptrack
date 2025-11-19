import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  
  primary: '#FF9500',
  primaryDark: '#E68600',
  primaryTransparent: 'rgba(255, 149, 0, 0.15)',
  primaryBorder: 'rgba(255, 149, 0, 0.3)',
  
  cyan: '#06B6D4',
  cyanTransparent: 'rgba(6, 182, 212, 0.15)',
  cyanBorder: 'rgba(6, 182, 212, 0.3)',
  
  purple: '#9333EA',
  purpleTransparent: 'rgba(147, 51, 234, 0.15)',
  purpleBorder: 'rgba(147, 51, 234, 0.3)',
  
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  danger: '#FF453A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    backgroundColor: COLORS.bg,
    zIndex: 999,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: normalize(40),
    justifyContent: 'center',
    minWidth: normalize(70),
    alignItems: 'center',
  },

  finishButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  cancelText: {
    fontSize: normalize(14),
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  finishText: {
    fontSize: normalize(14),
    color: COLORS.bg,
    fontWeight: '700',
  },

  finishTextDisabled: {
    color: COLORS.textMuted,
    opacity: 0.7,
  },

  timerContainer: {
    position: 'relative',
    width: normalize(90),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },

  timerProgress: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryTransparent,
    borderRadius: normalize(20),
    opacity: 0.6,
  },

  timerInner: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    backgroundColor: COLORS.surfaceLight,
    borderRadius: normalize(16),
  },

  timerText: {
    fontSize: normalize(16),
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollViewContent: {
    flexGrow: 1,
    paddingTop: normalize(16),
    paddingBottom: normalize(140),
  },

  scrollViewContentEmpty: {
    flexGrow: 1,
    paddingBottom: normalize(24),
    paddingTop: 0,
  },

  commandCenter: {
    position: 'absolute',
    bottom: normalize(32),
    left: '50%',
    transform: [{ translateX: -normalize(90) }],
    zIndex: 2000,
  },

  commandAdd: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
    borderRadius: normalize(25),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    minWidth: normalize(180),
    alignItems: 'center',
    justifyContent: 'center',
  },

  commandButtonText: {
    color: COLORS.bg,
    fontSize: normalize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(24),
  },

  emptyStateContent: {
    alignItems: 'center',
    maxWidth: normalize(320),
  },

  emptyStateIconContainer: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    backgroundColor: COLORS.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(24),
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },

  emptyStateTitle: {
    fontSize: normalize(24),
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: normalize(8),
    letterSpacing: 0.5,
  },

  emptyStateSubtitle: {
    fontSize: normalize(16),
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: normalize(32),
    lineHeight: normalize(22),
  },

  addExerciseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(32),
    borderRadius: normalize(25),
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  addExerciseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addExerciseButtonText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.bg,
    marginLeft: normalize(8),
    letterSpacing: 0.5,
  },

  emptyStateHint: {
    fontSize: normalize(14),
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: normalize(12),
  },

  customKeyboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
  },
});

export default styles;