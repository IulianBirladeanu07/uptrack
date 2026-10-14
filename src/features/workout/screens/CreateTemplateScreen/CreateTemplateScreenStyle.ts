import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: radius[2],
    backgroundColor: colors.border.default,
  },
  placeholder: {
    width: spacing[8],
  },

  notificationContainer: {
    position: 'absolute',
    bottom: spacing[24],
    alignSelf: 'center',
    width: '80%',
    height: spacing[24],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  notificationInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius[2],
    padding: spacing[3],
  },
  notificationText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    lineHeight: fontSize[18],
    flex: 1,
    marginRight: spacing[2],
  },
  notificationActionButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  notificationActionText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.background.primary,
    textTransform: 'uppercase',
  },
  alertContainer: {
    position: 'absolute',
    top: '90%',
    alignSelf: 'center',
    width: '100%',
    maxWidth: spacing[100],
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    backgroundColor: colors.background.tertiary,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize[20],
    flex: 1,
    marginRight: spacing[3],
  },
  alertActionButton: {
    borderRadius: radius[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.accent.primary,
  },
  alertActionText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    color: colors.background.primary,
    textTransform: 'uppercase',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing[5],
  },
  modalContent: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius[3],
    padding: spacing[5],
    width: '100%',
    maxWidth: spacing[90],
  },
  modalTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[2],
    padding: spacing[3],
    fontSize: fontSize[16],
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[2],
    backgroundColor: colors.background.secondary,
  },
  primaryButton: {
    backgroundColor: colors.accent.primary,
  },
  buttonText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  primaryButtonText: {
    color: colors.background.primary,
    fontWeight: fontWeight.semibold,
  },
  disabledButton: {
    backgroundColor: colors.text.quaternary,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: colors.text.secondary,
  },

  contentContainer: {
    flex: 1,
    padding: spacing[3],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: fontSize[16],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[15],
    paddingHorizontal: spacing[8],
  },
  emptyStateTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: fontSize[20],
  },
}));

export default styles;