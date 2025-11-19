// ExerciseSelectionScreenStyle.js
import { StyleSheet, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
  background: '#0A0E13',
  cardBackground: '#151B23',
  cardBackgroundDark: '#151B23',
  gradientOverlay: 'rgba(255, 133, 53, 0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textInactive: 'rgba(255, 255, 255, 0.4)',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  accentPrimary: '#ff8535',
  accentSecondary: '#00d4ff',
  accentPurple: '#a855f7',
  success: '#10b981',
  warning: '#facc15',
  error: '#ef4444',
  shadow: 'rgba(0, 0, 0, 0.3)',
  mutedOrange: 'rgba(255, 133, 53, 0.8)',
  mutedBlue: 'rgba(0, 212, 255, 0.7)',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  headerBackground: 'rgba(15, 23, 42, 0.95)',
  createButtonGlow: 'rgba(255, 133, 53, 0.25)',
  filterPillGlow: 'rgba(255, 133, 53, 0.15)',
  glassEffect: 'rgba(255, 255, 255, 0.05)',
};

const BORDER_RADIUS = normalize(16);
const CONTAINER_PADDING = normalize(18);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Header Layout with integrated filter bar
  headerContainer: {
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.border,
    paddingTop: normalize(20),
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: normalize(16), // Adds space for the filter bar
  },

  // Gradient overlay for depth
  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 133, 53, 0.02)',
    zIndex: 0,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: normalize(24),
    paddingBottom: normalize(20),
    paddingHorizontal: CONTAINER_PADDING,
    zIndex: 1,
  },

  // Enhanced back button with focus states
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

  backButtonFocused: {
    backgroundColor: 'rgba(255, 133, 53, 0.08)',
    borderColor: 'rgba(255, 133, 53, 0.3)',
    shadowColor: COLORS.accentPrimary,
    shadowOpacity: 0.2,
  },

  // Enhanced create button with glow effect
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(14),
    backgroundColor: COLORS.accentPrimary,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },

  createButtonFocused: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },

  createButtonGlowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: normalize(16),
    backgroundColor: COLORS.accentPrimary,
    opacity: 0.3,
    zIndex: -1,
  },

  createButtonText: {
    color: COLORS.background,
    fontSize: normalize(13),
    fontWeight: '700',
    marginLeft: normalize(8),
    letterSpacing: normalize(0.4),
  },

  createButtonIcon: {
    color: COLORS.background,
  },

  // Enhanced header title
  headerTitle: {
    fontSize: normalize(22),
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
    letterSpacing: normalize(-0.5),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 1,
  },

  // Enhanced search container with dynamic effects
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassEffect,
    borderRadius: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    paddingHorizontal: normalize(18),
    marginHorizontal: CONTAINER_PADDING,
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

  // Animated glow effect for search
  searchGlowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: normalize(20),
    backgroundColor: COLORS.accentPrimary,
    opacity: 0,
    zIndex: -1,
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

  searchInputFocused: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Enhanced clear button
  clearSearchButton: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 133, 53, 0.08)',
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: normalize(8),
  },

  // Search hint container
  searchHintContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: normalize(8),
    alignItems: 'center',
  },

  searchHintText: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: normalize(0.3),
  },

  filterContainer: {
    paddingHorizontal: CONTAINER_PADDING,
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
    backgroundColor: COLORS.accentPrimary,
    borderColor: 'rgba(255, 133, 53, 0.4)',
    shadowColor: COLORS.accentPrimary,
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
    backgroundColor: COLORS.filterPillGlow,
    opacity: 0.6,
    zIndex: -1,
  },

  // Updated list container to account for header changes
  listContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: normalize(120),
    paddingTop: normalize(16),
  },

  // Removed spacing from section header since pills are in header now
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
    backgroundColor: COLORS.cardBackgroundDark,
    borderRadius: BORDER_RADIUS,
    marginBottom: normalize(10),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseContainerSelected: {
    borderColor: 'rgba(255, 133, 53, 0.6)',
    borderWidth: normalize(1.5),
    backgroundColor: 'rgba(22, 25, 28, 1)',
  },

  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(12),
    paddingBottom: normalize(12),
    paddingRight: normalize(16),
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: normalize(12),
  },

  exerciseImageContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(16),
    flexShrink: 0,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    overflow: 'hidden',
    padding: normalize(1),
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  exerciseTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: normalize(44),
  },
  exerciseName: {
    fontSize: normalize(17),
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: normalize(22),
    marginBottom: normalize(6),
  },
  exerciseCategory: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'capitalize',
    lineHeight: normalize(16),
  },

  // Centering the selection button
  selectionButton: {
    alignSelf: 'center', // This centers the button vertically
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
    backgroundColor: COLORS.accentPrimaryFaded,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.25)',
    shadowColor: COLORS.accentPrimary,
  },
  selectedExerciseButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: normalize(1),
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: COLORS.success,
  },

  doneButton: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: normalize(16),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(32),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.4)',
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
    paddingBottom: normalize(50),
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: normalize(16),
    textAlign: 'center',
    lineHeight: normalize(24),
    fontWeight: '500',
  },
  clearButton: {
    marginTop: normalize(24),
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(24),
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS,
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
    marginBottom: normalize(20),
    textAlign: 'center',
    paddingHorizontal: normalize(20),
    lineHeight: normalize(22),
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(16),
    marginTop: normalize(16),
  },
  retryButton: {
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(28),
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    shadowColor: COLORS.accentPrimary,
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
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },
});

export default styles;