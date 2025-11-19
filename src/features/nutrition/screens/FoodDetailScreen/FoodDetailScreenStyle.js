import { StyleSheet, Dimensions, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.28;

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  danger: '#FF453A',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(10, 14, 19, 0.85)',
  imagePlaceholder: '#1F2937',
  primaryTransparent: 'rgba(255, 149, 0, 0.1)',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scrollView: {
    paddingTop: normalize(20),
    flex: 1,
  },

  heroSection: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImage: {
    width: normalize(160),
    height: normalize(160),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? normalize(50) : normalize(20),
    left: normalize(16),
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingFavoriteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? normalize(50) : normalize(20),
    right: normalize(16),
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    marginTop: normalize(-20),
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: normalize(20),
    paddingTop: normalize(24),
    paddingBottom: normalize(120),
  },
  foodName: {
    fontSize: normalize(24),
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: normalize(20),
    letterSpacing: -0.5,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: normalize(28),
  },

  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(16),
    letterSpacing: 0.3,
  },
  nutrientsList: {
    backgroundColor: COLORS.surface,
    borderRadius: normalize(16),
    paddingHorizontal: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: normalize(20),
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: normalize(14),
    height: normalize(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    marginBottom: normalize(20),
  },
  addButtonText: {
    color: '#0f172a',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(40),
  },
  errorText: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: normalize(16),
    textAlign: 'center',
  },
});