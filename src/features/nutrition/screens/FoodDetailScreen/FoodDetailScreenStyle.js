import { Dimensions } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.28;

export default createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },

  scrollView: {
    paddingTop: spacing[5],
    flex: 1,
  },

  heroSection: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImage: {
    width: spacing[40],
    height: spacing[40],
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  floatingBackButton: {
    position: 'absolute',
    top: spacing[5],
    left: spacing[4],
    width: spacing[11],
    height: spacing[11],
    borderRadius: 22,
    backgroundColor: colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingFavoriteButton: {
    position: 'absolute',
    top: spacing[5],
    right: spacing[4],
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[5],
    backgroundColor: colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    marginTop: spacing[5],
    borderTopLeftRadius: radius[6],
    borderTopRightRadius: radius[6],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[32],
  },
  foodName: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[5],
    letterSpacing: -0.5,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing[7],
  },

  sectionTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    letterSpacing: 0.3,
  },
  nutrientsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[20],
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[5],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 14,
    height: spacing[14],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  addButtonText: {
    color: colors.accent.buttonText,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[10],
  },
  errorText: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: 'center',
  },
}));