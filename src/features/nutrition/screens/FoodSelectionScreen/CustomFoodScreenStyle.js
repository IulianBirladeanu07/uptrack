import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[5],
    paddingTop: spacing[10],
  },
  header: {
    color: colors.text.primary,
    fontSize: fontSize[24],
    fontWeight: fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: spacing[6],
    letterSpacing: -0.5,
  },
  inputWrapper: {
    marginBottom: spacing[5],
  },
  labelContainer: {
    marginBottom: spacing[2],
  },
  label: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    height: spacing[13],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  errorInput: {
    borderColor: colors.accent.error,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize[12],
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  section: {
    marginTop: spacing[2],
    marginBottom: spacing[7],
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
    letterSpacing: -0.2,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otherNutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  nutrientHeader: {
    marginBottom: spacing[2],
  },
  labelWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  nutrientCell: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    height: spacing[12],
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  nutrientInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
  },
  nutrientHeaderLabel: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
  },
  unitText: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    padding: spacing[1],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius[2],
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
  },
  activeTabText: {
    color: colors.background.primary,
  },
  footer: {
    padding: spacing[4],
    paddingTop: spacing[4],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  amountInput: {
    flex: 1.5,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    height: spacing[12],
    color: colors.text.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  unitSelector: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing[12],
    gap: spacing[2],
    elevation: 4,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: spacing[1] },
    shadowOpacity: 0.3,
    shadowRadius: spacing[2],
  },
  addButtonDisabled: {
    opacity: 0.4,
    backgroundColor: colors.text.secondary,
  },
  addButtonText: {
    color: colors.background.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.extrabold,
  },
});

export default styles;