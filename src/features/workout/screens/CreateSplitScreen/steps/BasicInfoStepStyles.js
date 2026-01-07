import { StyleSheet } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const COLORS = {
  primary: colors.primary,
  secondary: colors.bg,
  accentPrimary: colors.primary,
  accentSecondary: colors.cyan,
  accentPurple: colors.purple,
  background: colors.bg,
  card: colors.surface,
  cardDark: colors.surfaceLight,
  cardBackground: colors.surfaceLight,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textInactive: 'rgba(255, 255, 255, 0.4)',
  textMuted: colors.textTertiary,
  border: colors.border,
  borderDivider: colors.borderLight,
  white: colors.textPrimary,
  shadow: 'rgba(0, 0, 0, 0.3)',
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  success: colors.success,
  accentPrimaryFaded: 'rgba(255, 149, 0, 0.15)',
};

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: normalize(16),
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  orangeIconContainer: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: normalize(16),
  },
  inputLabel: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: normalize(8),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(8),
    padding: normalize(12),
    fontSize: normalize(14),
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workoutNameInput: {
    height: normalize(48),
  },
  notesInput: {
    height: normalize(100),
  },
  noteHelperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(4),
  },
  noteHelper: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
  },
  charCount: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
  },
  splitTypeContainer: {
    gap: normalize(8),
  },
  splitTypeOption: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(12),
    padding: normalize(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitTypeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentPrimaryFaded,
  },
  splitTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: normalize(12),
  },
  splitTypeIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTypeIconSelected: {
    backgroundColor: COLORS.white,
  },
  splitTypeTextContainer: {
    flex: 1,
  },
  splitTypeTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  splitTypeTitleSelected: {
    color: COLORS.textPrimary,
  },
  splitTypeSubtitle: {
    fontSize: normalize(12),
    color: COLORS.textSecondary,
  },
  splitTypeSubtitleSelected: {
    color: COLORS.textMuted,
  },
  splitTypeCheck: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTypeCheckSelected: {
    backgroundColor: COLORS.white,
  },
});