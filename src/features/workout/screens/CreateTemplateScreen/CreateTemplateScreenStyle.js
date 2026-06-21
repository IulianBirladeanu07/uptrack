import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderLight,
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
    backgroundColor: COLORS.border,
  },
  placeholder: {
    width: normalize(32),
  },

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
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.bg,
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
    borderColor: COLORS.border,
    padding: normalize(16),
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.bg,
    textTransform: 'uppercase',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: normalize(20),
  },
  modalContent: {
    backgroundColor: COLORS.surfaceLight,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.bg,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: COLORS.textSecondary,
  },

  contentContainer: {
    flex: 1,
    padding: normalize(12),
  },

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