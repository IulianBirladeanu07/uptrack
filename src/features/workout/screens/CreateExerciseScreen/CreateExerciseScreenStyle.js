import { StyleSheet, Dimensions, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const { height, width } = Dimensions.get('window');

// --- Unified Theme Colors (matching CreateWorkoutScreenStyle) ---
export const COLORS = {
  primary: '#ff8535', // Orange primary
  primaryDark: '#0284C7',
  primaryLight: '#FFBC7D',
  primaryTransparent: 'rgba(255, 133, 53, 0.15)',
  secondary: '#02111B', // Dark blue secondary
  accent: '#FFFFFF',
  accent2: '#00d4ff', // Cyan accent
  accent2Transparent: 'rgba(0, 212, 255, 0.15)',
  accent2Border: 'rgba(0, 212, 255, 0.5)',
  accentPurple: '#a855f7', // Purple accent
  background: '#02111B', // Dark blue background
  card: 'rgba(30, 41, 59, 0.5)', // Card background
  cardDark: 'rgba(15, 23, 42, 0.9)', // Dark card
  cardAlt: 'rgba(15, 23, 42, 0.8)',
  cardBackground: 'rgba(15, 23, 42, 0.8)',
  text: '#FFFFFF', // White text primary
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db', // Light gray text
  textMuted: '#9ca3af', // Muted text
  textInactive: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(255, 255, 255, 0.1)', // Border
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  borderVariations: [
    'rgba(255, 133, 53, 0.2)', // Orange border
    'rgba(0, 212, 255, 0.2)', // Cyan border
    'rgba(168, 85, 247, 0.2)', // Purple border
  ],
  divider: 'rgba(255, 255, 255, 0.05)',
  error: '#FCA5A5',
  success: '#10b981', // Success green
  warning: '#FCD34D',
  info: '#67E8F9',
  disabled: '#52525B',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.3)', // Shadow
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)', // Faded orange

  // Aliases for consistency
  accentPrimary: '#ff8535',
  accentSecondary: '#00d4ff',
  surface: 'rgba(15, 23, 42, 0.8)',
  inputBackground: 'rgba(30, 41, 59, 0.5)',
  inputBackgroundFocused: 'rgba(30, 41, 59, 0.9)',
  overlay: 'rgba(2, 17, 27, 0.96)',
  borderFocused: 'rgba(255, 133, 53, 0.5)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',

  gradient: {
    primary: ['#ff8535', '#F17C12'], // Orange gradient
    button: ['#ff8535', '#FFBC7D'],
    nav: ['rgba(30, 41, 59, 0.7)', 'rgba(2, 17, 27, 0.8)'],
    border: ['rgba(255, 133, 53, 0.3)', 'rgba(0, 212, 255, 0.3)'],
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainerWithButton: {
    flex: 1,
  },

  // Header styles matching your main theme
  header: {
    paddingHorizontal: normalize(18),
    paddingTop: normalize(40),
    paddingBottom: normalize(16),
    borderBottomWidth: normalize(1),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(14),
  },

  backButton: {
    padding: normalize(10),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  helpButton: {
    padding: normalize(10),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: normalize(14),
  },

  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: normalize(4),
  },

  headerSubtitle: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },

  progressBar: {
    flex: 1,
    height: normalize(6),
    backgroundColor: COLORS.progressBarTrack,
    borderRadius: normalize(3),
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: normalize(3),
  },

  progressText: {
    fontSize: normalize(12),
    fontWeight: '600',
    minWidth: normalize(80),
    textAlign: 'right',
  },

  // Content styles matching your card design
  content: {
    flex: 1,
  },

  contentContainer: {
    padding: normalize(18),
    paddingBottom: normalize(120),
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(18),
    padding: normalize(18),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },

  // Field styles matching your input design
  fieldContainer: {
    marginBottom: normalize(20),
  },

  fieldLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: normalize(8),
    flexDirection: 'row',
    alignItems: 'center',
  },

  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    fontSize: normalize(16),
    color: COLORS.text,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    minHeight: normalize(50),
  },

  textInputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackgroundFocused,
  },

  characterCount: {
    fontSize: normalize(11),
    color: COLORS.textMuted,
    marginTop: normalize(6),
    alignSelf: 'flex-end',
    fontWeight: '500',
  },

  fieldError: {
    borderColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(8),
    gap: normalize(6),
  },

  errorText: {
    fontSize: normalize(12),
    color: COLORS.error,
    fontWeight: '500',
  },

  // Picker styles matching your button design
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderWidth: 0.5,
    borderColor: COLORS.border,
    minHeight: normalize(50),
  },

  pickerSelected: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.inputBackgroundFocused,
    shadowColor: COLORS.accentPrimary,

  },

  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  pickerIconContainer: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },

  pickerEmoji: {
    fontSize: normalize(16),
  },

  pickerText: {
    fontSize: normalize(15),
    fontWeight: '500',
    flex: 1,
  },

  pickerTextSelected: {
    color: COLORS.textPrimary,
  },

  placeholderText: {
    color: COLORS.textMuted,
  },

  // Modal styles matching your theme
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },

  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: normalize(18),
    paddingTop: normalize(12),
    paddingBottom: normalize(20),
    maxHeight: height * 0.8,
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },

  modalHandle: {
    width: normalize(40),
    height: normalize(4),
    backgroundColor: COLORS.textInactive,
    borderRadius: normalize(2),
    alignSelf: 'center',
    marginBottom: normalize(16),
  },

  modalHeader: {
    alignItems: 'center',
    marginBottom: normalize(16),
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
    paddingBottom: normalize(14),
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },

  modalTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(14),
    paddingHorizontal: normalize(14),
    marginBottom: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    minHeight: normalize(48),
  },

  searchInput: {
    flex: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(8),
    fontSize: normalize(15),
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  modalContent: {
    flex: 1,
  },

  // Option items matching your list design
  menuItemWrapper: {
    marginBottom: normalize(10),
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(14),
    backgroundColor: COLORS.cardBackground,
    borderRadius: normalize(14),
    borderWidth: normalize(1),
    borderColor: COLORS.borderDivider,
    minHeight: normalize(70),
  },

  optionSelected: {
    backgroundColor: 'rgba(255, 133, 53, 0.12)',
    borderColor: COLORS.accentPrimary,
    shadowColor: COLORS.accentPrimary,
  },

  menuIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(14),
    borderWidth: normalize(1),
  },

  menuText: {
    flex: 1,
    justifyContent: 'center',
  },

  menuLabel: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: normalize(22),
  },

  optionNameSelected: {
    color: COLORS.accentPrimary,
  },

  menuSublabel: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    marginTop: normalize(2),
    lineHeight: normalize(18),
    fontWeight: '500',
  },

  checkmarkContainer: {
    marginLeft: 'auto',
    paddingLeft: normalize(12),
  },

  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(40),
  },

  noResultsText: {
    fontSize: normalize(17),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: normalize(16),
    textAlign: 'center',
  },

  noResultsSubtext: {
    fontSize: normalize(13),
    color: COLORS.textMuted,
    marginTop: normalize(6),
    textAlign: 'center',
    fontWeight: '500',
  },

  // Summary card matching your progress design
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: normalize(16),
    padding: normalize(18),
    marginTop: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.success,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    marginBottom: normalize(12),
  },

  summaryTitle: {
    fontSize: normalize(17),
    fontWeight: '700',
    color: COLORS.success,
  },

  summaryContent: {
    paddingLeft: normalize(28),
  },

  summaryText: {
    fontSize: normalize(14),
    color: COLORS.textPrimary,
    marginBottom: normalize(6),
    lineHeight: normalize(20),
    fontWeight: '500',
  },

  summaryLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Submit button matching your start button design
  submitSectionFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: normalize(18),
    paddingTop: normalize(14),
    paddingBottom: normalize(18),
    borderTopWidth: normalize(1),
    borderTopColor: COLORS.borderDivider,
    zIndex: 15,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: normalize(14),
    paddingVertical: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    minHeight: normalize(54),
  },

  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowColor: 'transparent',
    elevation: 0,
  },

  submitButtonLoading: {
    backgroundColor: COLORS.accentSecondary,
    shadowColor: COLORS.accentSecondary,
  },

  submitButtonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: normalize(0.5),
  },
});

export default styles;