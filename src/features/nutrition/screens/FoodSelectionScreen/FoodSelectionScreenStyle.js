import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  
  primary: '#FF9500',
  primaryDark: '#E68600',
  
  success: '#32D74B',
  danger: '#FF453A',
  warning: '#FF9F0A',
  blue: '#3B82F6',
  purple: '#9333EA',
  
  white: '#FFFFFF',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  
  protein: '#BA68C8',
  proteinBg: 'rgba(186, 104, 200, 0.15)',
  carbs: '#32D74B',
  carbsBg: 'rgba(50, 215, 75, 0.15)',
  fat: '#FF9500',
  fatBg: 'rgba(255, 149, 0, 0.15)',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
  },
  trackFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackFoodTitle: {
    fontSize: normalize(28),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  trackFoodDate: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderWidth: 1,
    borderColor: colors.border,
  },
  calorieBadgeText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primary,
  },
  headerContainer: {
    paddingBottom: normalize(12),
  },
  headerContainerCollapsed: {
    paddingBottom: normalize(8),
  },
  headerContainerSearching: {
    paddingBottom: normalize(16),
    paddingTop: normalize(10),
  },
  searchContainer: {
  },
  searchBox: {
    backgroundColor: colors.surface,
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(12),
    gap: normalize(8),
  },
  searchLoadingText: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  foodListContainer: {
    flex: 1,
  },
  foodListContainerExpanded: {
  },
  foodListContainerSearching: {
  },
  toggleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(14),
  },
  toggleText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  foodContainer: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: normalize(14),
    marginBottom: normalize(8),
    padding: normalize(12),
    backgroundColor: colors.surface,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  foodImage: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: normalize(2),
    lineHeight: normalize(17),
  },
  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(5),
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  macroLabel: {
    paddingHorizontal: normalize(7),
    paddingVertical: normalize(3),
    borderRadius: normalize(12),
    fontSize: normalize(10),
    fontWeight: '600',
    lineHeight: normalize(13),
  },
  macroProtein: {
    backgroundColor: colors.proteinBg,
    color: colors.protein,
  },
  macroCarbs: {
    backgroundColor: colors.carbsBg,
    color: colors.carbs,
  },
  macroFat: {
    backgroundColor: colors.fatBg,
    color: colors.fat,
  },
  foodCalories: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    minWidth: normalize(60),
  },
  plusButton: {
    width: normalize(32),
    height: normalize(32),
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: normalize(20),
    right: normalize(20),
    width: normalize(56),
    height: normalize(56),
    backgroundColor: colors.primary,
    borderRadius: normalize(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  infoText: {
    fontSize: normalize(16),
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: normalize(22),
  },
});