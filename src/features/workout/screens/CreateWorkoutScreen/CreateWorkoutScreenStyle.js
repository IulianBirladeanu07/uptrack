import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
  primary: '#ff8535', // Orange primary from your theme
  primaryDark: '#0284C7',
  primaryLight: '#FFBC7D',
  primaryTransparent: 'rgba(255, 133, 53, 0.15)', // Orange with transparency
  secondary: '#02111B', // Dark blue secondary
  accent: '#FFFFFF',
  accent2: '#00d4ff', // Cyan accent from your theme
  accent2Transparent: 'rgba(0, 212, 255, 0.15)',
  accent2Border: 'rgba(0, 212, 255, 0.5)',
  accentPurple: '#a855f7', // Purple accent from your theme
  background: '#02111B', // Dark blue background
  card: 'rgba(30, 41, 59, 0.4)', // Card background from your theme
  cardDark: 'rgba(15, 23, 42, 0.8)', // Dark card from your theme
  cardAlt: 'rgba(15, 23, 42, 0.8)',
  cardBackground: 'rgba(15, 23, 42, 0.8)',
  text: '#FFFFFF', // White text primary
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db', // Light gray text
  textMuted: '#9ca3af', // Muted text
  textInactive: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(255, 255, 255, 0.1)', // Border from your theme
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  borderVariations: [
    'rgba(255, 133, 53, 0.2)', // Orange border
    'rgba(0, 212, 255, 0.2)', // Cyan border
    'rgba(168, 85, 247, 0.2)', // Purple border
  ],
  divider: 'rgba(255, 255, 255, 0.05)',
  error: '#FCA5A5',
  success: '#10b981', // Success green from your theme
  warning: '#FCD34D',
  info: '#67E8F9',
  disabled: '#52525B',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.3)', // Shadow from your theme
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)', // Faded orange from your theme
  gradient: {
    primary: ['#ff8535', '#F17C12'], // Orange gradient
    button: ['#ff8535', '#FFBC7D'],
    nav: ['rgba(30, 41, 59, 0.7)', 'rgba(2, 17, 27, 0.8)'],
    border: ['rgba(255, 133, 53, 0.3)', 'rgba(0, 212, 255, 0.3)'],
  },
};

const styles = StyleSheet.create({
  // Main screen structure
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(50),
    paddingBottom: normalize(20),
    backgroundColor: COLORS.secondary,
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: normalize(8),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholder: {
    width: normalize(32),
  },

  // Notification/Alert styles
  notificationContainer: {
    position: 'absolute',
    bottom: normalize(100),
    alignSelf: 'center',
    width: '80%',
    height: normalize(100),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
  },
  notificationInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(8),
    padding: normalize(12),
  },
  notificationText: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: normalize(18),
    flex: 1,
    marginRight: normalize(8),
  },
  notificationActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: normalize(8),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
  },
  notificationActionText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  alertContainer: {
    position: 'absolute',
    top: '90%',
    alignSelf: 'center',
    width: '100%',
    maxWidth: normalize(400),
    borderRadius: normalize(12),
    borderWidth: 1,
    padding: normalize(16),
    backgroundColor: COLORS.cardDark,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: normalize(20),
    flex: 1,
    marginRight: normalize(12),
  },
  alertActionButton: {
    borderRadius: normalize(8),
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    backgroundColor: COLORS.primary,
  },
  alertActionText: {
    fontSize: normalize(13),
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: normalize(20),
  },
  modalContent: {
    backgroundColor: COLORS.cardDark,
    borderRadius: normalize(12),
    padding: normalize(20),
    width: '100%',
    maxWidth: normalize(360),
  },
  modalTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(16),
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(8),
    padding: normalize(10),
    fontSize: normalize(15),
    color: COLORS.textPrimary,
    marginBottom: normalize(16),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(10),
  },
  modalButton: {
    flex: 1,
    padding: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: normalize(8),
    backgroundColor: COLORS.card,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  primaryButtonText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: COLORS.textMuted,
  },

  // Content container for steps
  contentContainer: {
    flex: 1,
    padding: normalize(12),
  },

  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(50),
  },
  loadingText: {
    marginTop: normalize(12),
    fontSize: normalize(16),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(60),
    paddingHorizontal: normalize(32),
  },
  emptyStateTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: normalize(16),
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: normalize(20),
  },
});

export default styles;