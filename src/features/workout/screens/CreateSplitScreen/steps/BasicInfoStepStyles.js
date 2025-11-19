import { StyleSheet } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  primary: '#ff8535',
  secondary: '#02111B',
  accentPrimary: '#ff8535',
  accentSecondary: '#00d4ff',
  accentPurple: '#a855f7',
  background: '#02111B',
  card: 'rgba(30, 41, 59, 0.4)',
  cardDark: 'rgba(15, 23, 42, 0.8)',
  cardBackground: 'rgba(15, 23, 42, 0.8)',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textInactive: 'rgba(255, 255, 255, 0.4)',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.3)',
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  success: '#10b981',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',
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
    color: COLORS.textPrimary,
    marginBottom: normalize(8),
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(8),
    padding: normalize(12),
    fontSize: normalize(14),
    color: COLORS.textPrimary,
  },
  workoutNameInput: {
    height: normalize(48),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
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