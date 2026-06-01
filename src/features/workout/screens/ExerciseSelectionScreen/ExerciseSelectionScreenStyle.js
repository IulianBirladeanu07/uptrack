import { Platform } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

export const COLORS = {
  background: colors.background.primary,
  cardBackground: colors.background.secondary,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.tertiary,
  border: colors.border.default,
  borderLight: colors.border.light,
  primaryOrange: colors.accent.primary,
  primaryOrangeFaded: colors.faded.primary,
  primaryOrangeLight: colors.faded.primaryLight,
  primaryOrangeBorder: colors.border.primary,
  primaryOrangeGradient: colors.faded.primaryExtraLight,
  success: colors.accent.success,
  successFaded: colors.faded.successAlt,
  successBorder: colors.border.successAlt,
  error: colors.accent.errorAlt,
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
  glassEffect: colors.faded.surface,
  glassEffectLight: colors.faded.surfaceLight,
  imageBorder: colors.border.default,
  imageBackground: colors.background.tertiary,
  selectedBackground: colors.background.selectedCard,
  primaryOrangeBorderStrong: colors.border.primarySelected,
  primaryOrangeGlow: colors.border.primarySelected,
};

export const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerContainer: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[4],
    zIndex: 1,
  },

  backButton: {
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[3],
    backgroundColor: colors.faded.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },

  headerTitle: {
    fontSize: fontSize[22],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.5,
    zIndex: 1,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.faded.surface,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[4],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },

  searchIcon: {
    marginRight: spacing[3],
    opacity: 0.7,
  },

  searchInput: {
    flex: 1,
    height: spacing.inputHeight,
    color: colors.text.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    paddingVertical: 0,
    letterSpacing: 0.2,
  },

  clearSearchButton: {
    padding: spacing[2],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primaryLight,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },

  filterContainer: {
    paddingHorizontal: spacing[4],
    zIndex: 1,
  },

  filtersRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },

  filterPill: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radius[5],
    backgroundColor: colors.faded.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  filterPillActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.border.primarySelected,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  filterText: {
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize[12],
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  filterTextActive: {
    color: colors.background.primary,
    fontWeight: fontWeight.extrabold,
  },

  filterPillGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: colors.faded.primary,
    opacity: 0.6,
    zIndex: -1,
  },

  listContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[30],
    paddingTop: spacing[4],
  },

  listContainerEmpty: {
    flexGrow: 1,
  },

  sectionHeaderContainer: {
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[1],
    backgroundColor: colors.background.primary,
    paddingTop: spacing[2],
  },

  sectionHeaderText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  exerciseContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },

  exerciseContainerSelected: {
    borderColor: colors.border.primarySelected,
    borderWidth: 1.5,
    backgroundColor: colors.background.selectedCard,
  },

  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
    gap: spacing[2],
  },

  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  exerciseImageContainer: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[2],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.faded.surfaceLight,
    overflow: 'hidden',
    padding: spacing[1],
  },

  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  exerciseTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  exerciseName: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },

  exerciseCategory: {
    fontSize: fontSize[10],
    color: colors.text.tertiary,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },

  selectionButton: {
    alignSelf: 'center',
    padding: spacing[2],
    borderRadius: radius[5],
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  addExerciseButton: {
    backgroundColor: colors.faded.surfaceMedium,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  selectedExerciseButton: {
    backgroundColor: colors.faded.successAlt,
    borderWidth: 1,
    borderColor: colors.border.successAlt,
    shadowColor: colors.accent.success,
  },

  doneButtonContainer: {
    position: 'absolute',
    bottom: spacing[20],
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },

  doneButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border.primarySelected,
  },

  doneButtonText: {
    color: colors.background.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },

  emptyText: {
    color: colors.text.secondary,
    fontSize: fontSize[16],
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: fontWeight.medium,
    marginTop: spacing[4],
  },

  clearButton: {
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    elevation: 2,
  },

  clearButtonText: {
    color: colors.text.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
  },

  loadingText: {
    marginTop: spacing[4],
    color: colors.text.secondary,
    fontSize: fontSize[16],
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },

  errorText: {
    color: colors.accent.errorAlt,
    fontSize: fontSize[16],
    marginVertical: spacing[5],
    textAlign: 'center',
    paddingHorizontal: spacing[5],
    lineHeight: 22,
    fontWeight: fontWeight.medium,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },

  retryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[7],
    borderRadius: radius[4],
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  retryButtonText: {
    color: colors.background.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize[14],
  },

  backButtonError: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[7],
    borderRadius: radius[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius[3],
    backgroundColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  createButtonText: {
    color: colors.background.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    marginLeft: spacing[1],
  },
}));

export default styles;