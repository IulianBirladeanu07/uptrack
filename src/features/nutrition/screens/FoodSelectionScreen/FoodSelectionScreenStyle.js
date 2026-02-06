import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  headerContainer: {
    paddingBottom: spacing[3],
  },
  headerContainerCollapsed: {
    paddingBottom: spacing[2],
  },
  headerContainerSearching: {
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  searchBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  searchLoadingText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  foodListContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});