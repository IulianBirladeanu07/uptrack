import { StyleSheet, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
  background: '#0A0E13',
  cardBackground: '#151B23',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  primaryOrange: '#FF9500',
  primaryOrangeFaded: 'rgba(255, 149, 0, 0.15)',
  primaryOrangeLight: 'rgba(255, 149, 0, 0.08)',
  primaryOrangeBorder: 'rgba(255, 149, 0, 0.25)',
  primaryOrangeGradient: 'rgba(255, 149, 0, 0.02)',
  success: '#10b981',
  successFaded: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.25)',
  error: '#ef4444',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
  glassEffect: 'rgba(255, 255, 255, 0.05)',
  glassEffectLight: 'rgba(255, 255, 255, 0.06)',
  imageBorder: 'rgba(255, 255, 255, 0.08)',
  imageBackground: 'rgba(30, 41, 59, 0.8)',
  selectedBackground: '#1a1d21',
  primaryOrangeBorderStrong: 'rgba(255, 149, 0, 0.4)',
  primaryOrangeGlow: 'rgba(255, 149, 0, 0.6)',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.border,
    paddingTop: normalize(20),
    paddingBottom: normalize(16),
  },

  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryOrangeGradient,
    zIndex: 0,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: normalize(24),
    paddingBottom: normalize(20),
    paddingHorizontal: normalize(18),
    zIndex: 1,
  },

  backButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    backgroundColor: COLORS.glassEffect,
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },

  spacer: {
    width: normalize(44),
  },

  headerTitle: {
    fontSize: normalize(22),
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
    letterSpacing: normalize(-0.5),
    textShadowColor: COLORS.shadowDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 1,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassEffect,
    borderRadius: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    paddingHorizontal: normalize(18),
    marginHorizontal: normalize(18),
    marginBottom: normalize(12),
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
    ...(Platform.OS === 'ios' && { backdropFilter: 'blur(20px)' }),
  },

  searchIcon: {
    marginRight: normalize(14),
    opacity: 0.7,
  },

  searchInput: {
    flex: 1,
    height: normalize(52),
    color: COLORS.textPrimary,
    fontSize: normalize(16),
    fontWeight: '500',
    paddingVertical: normalize(0),
    letterSpacing: normalize(0.2),
  },

  clearSearchButton: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: COLORS.primaryOrangeLight,
    borderWidth: normalize(1),
    borderColor: COLORS.primaryOrangeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: normalize(8),
  },

  filterContainer: {
    paddingHorizontal: normalize(18),
    zIndex: 1,
  },

  filtersRow: {
    flexDirection: 'row',
    gap: normalize(6),
  },

  filterPill: {
    paddingVertical: normalize(5),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(20),
    backgroundColor: COLORS.glassEffect,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  filterPillActive: {
    backgroundColor: COLORS.primaryOrange,
    borderColor: COLORS.primaryOrangeBorderStrong,
    shadowColor: COLORS.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  filterText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: normalize(12),
    textAlign: 'center',
    letterSpacing: normalize(0.2),
  },

  filterTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },

  filterPillGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: normalize(22),
    backgroundColor: COLORS.primaryOrangeFaded,
    opacity: 0.6,
    zIndex: -1,
  },

  listContainer: {
    paddingHorizontal: normalize(18),
    paddingBottom: normalize(120),
    paddingTop: normalize(16),
  },

  listContainerEmpty: {
    flexGrow: 1,
  },

  sectionHeaderContainer: {
    paddingBottom: normalize(8),
    paddingHorizontal: normalize(4),
    backgroundColor: COLORS.background,
    paddingTop: normalize(8),
  },

  sectionHeaderText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: normalize(1.2),
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  exerciseContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: normalize(12),
    marginBottom: normalize(10),
    borderWidth: normalize(1),
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: normalize(7),
    paddingVertical: normalize(7),
  },

  exerciseContainerSelected: {
    borderColor: COLORS.primaryOrangeGlow,
    borderWidth: normalize(1.5),
    backgroundColor: COLORS.selectedBackground,
  },

  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(4),
    gap: normalize(8),
  },

  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  exerciseImageContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
    flexShrink: 0,
    borderWidth: normalize(1),
    borderColor: COLORS.imageBorder,
    backgroundColor: COLORS.glassEffectLight,
    overflow: 'hidden',
    padding: normalize(5),
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
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: normalize(2),
  },

  exerciseCategory: {
    fontSize: normalize(10),
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  selectionButton: {
    padding: normalize(8),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  addExerciseButton: {
    backgroundColor: COLORS.primaryOrangeFaded,
    borderWidth: normalize(1),
    borderColor: COLORS.primaryOrangeBorder,
    shadowColor: COLORS.primaryOrange,
  },

  selectedExerciseButton: {
    backgroundColor: COLORS.successFaded,
    borderWidth: normalize(1),
    borderColor: COLORS.successBorder,
    shadowColor: COLORS.success,
  },

  doneButtonContainer: {
    position: 'absolute',
    bottom: normalize(80),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(20),
  },

  doneButton: {
    backgroundColor: COLORS.primaryOrange,
    borderRadius: normalize(16),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(32),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: COLORS.primaryOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: normalize(1),
    borderColor: COLORS.primaryOrangeBorderStrong,
  },

  doneButtonText: {
    color: COLORS.background,
    fontSize: normalize(16),
    fontWeight: '700',
    letterSpacing: normalize(0.5),
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(50),
  },

  emptyText: {
    color: COLORS.textSecondary,
    fontSize: normalize(16),
    textAlign: 'center',
    lineHeight: normalize(24),
    fontWeight: '500',
    marginTop: normalize(16),
  },

  clearButton: {
    marginTop: normalize(24),
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(24),
    backgroundColor: COLORS.cardBackground,
    borderRadius: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  clearButtonText: {
    color: COLORS.textPrimary,
    fontSize: normalize(14),
    fontWeight: '600',
  },

  loadingText: {
    marginTop: normalize(16),
    color: COLORS.textSecondary,
    fontSize: normalize(16),
    textAlign: 'center',
    fontWeight: '500',
  },

  errorText: {
    color: COLORS.error,
    fontSize: normalize(16),
    marginVertical: normalize(20),
    textAlign: 'center',
    paddingHorizontal: normalize(20),
    lineHeight: normalize(22),
    fontWeight: '500',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(16),
  },

  retryButton: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(28),
    borderRadius: normalize(16),
    alignItems: 'center',
    shadowColor: COLORS.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  retryButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: normalize(15),
  },

  backButtonError: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(28),
    borderRadius: normalize(16),
    alignItems: 'center',
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    backgroundColor: COLORS.primaryOrange,
    shadowColor: COLORS.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  createButtonText: {
    color: COLORS.background,
    fontSize: normalize(14),
    fontWeight: '700',
    marginLeft: normalize(6),
  },
});

export default styles;
