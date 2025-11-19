import { StyleSheet, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  background: '#0A0E13',
  navBackground: 'rgba(21, 27, 35, 0.95)',
  
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  
  accentPrimary: '#FF9500',
  accentDark: '#E68600',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderDivider: 'rgba(255, 255, 255, 0.05)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navBackground,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: normalize(12),
    borderTopWidth: normalize(1),
    borderTopColor: COLORS.borderDivider,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: normalize(4),
  },

  activeBackground: {
    position: 'absolute',
  },

  iconWrapper: {
    width: normalize(45),
    height: normalize(45),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  navLabel: {
    fontSize: normalize(10),
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: normalize(2),
    zIndex: 1,
  },

  navLabelActive: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
});

export default styles;