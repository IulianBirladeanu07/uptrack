import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
    primary: '#ff8535',
    secondary: '#02111B',
    accentPrimary: '#ff8535',
    accentSecondary: '#00d4ff',
    accentPurple: '#a855f7',
    background: '#02111B',
    card: 'rgba(30, 41, 59, 0.4)',
    cardDark: 'rgba(15, 23, 42, 0.8)',
    cardBackground: 'rgba(15, 23, 42, 0.8)',
    textPrimary: '#FFFFFF',
    textSecondary: '#d1d5db',
    textInactive: 'rgba(255, 255, 255, 0.4)',
    textMuted: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    borderDivider: 'rgba(255, 255, 255, 0.08)',
    white: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.3)',
    progressBarTrack: 'rgba(255, 255, 255, 0.1)',
    success: '#10b981',
    accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: normalize(20), // Adjusted for better spacing
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -normalize(16) }, { translateY: -normalize(16) }],
  },
viewActionsContainer: {
  flexDirection: 'row',
  paddingHorizontal: normalize(20),
  paddingVertical: normalize(16),
  paddingBottom: normalize(32),
  gap: normalize(12),
  backgroundColor: COLORS.background,
  borderTopWidth: 1,
  borderTopColor: COLORS.borderColor,
},

editSplitButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: normalize(14),
  backgroundColor: COLORS.cardBackground,
  borderRadius: normalize(12),
  borderWidth: 1,
  borderColor: COLORS.borderColor,
  gap: normalize(8),
},

editSplitText: {
  fontSize: normalize(14),
  fontWeight: '600',
  color: COLORS.textSecondary,
},

setActiveButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: normalize(14),
  backgroundColor: COLORS.cardBackground,
  borderRadius: normalize(12),
  borderWidth: 1,
  borderColor: COLORS.accentSecondary,
  gap: normalize(8),
},

setActiveText: {
  fontSize: normalize(14),
  fontWeight: '600',
  color: COLORS.accentSecondary,
},

startWorkoutButton: {
  flex: 1.5,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: normalize(14),
  backgroundColor: COLORS.accentPrimary,
  borderRadius: normalize(12),
  gap: normalize(8),
  shadowColor: COLORS.accentPrimary,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},

startWorkoutText: {
  fontSize: normalize(14),
  fontWeight: '700',
  color: COLORS.secondary,
},

headerEditButton: {
  padding: normalize(8),
  marginRight: -normalize(8),
},

// Loading indicator positioning
loadingIndicator: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  zIndex: 1000,
  marginTop: -normalize(20),
  marginLeft: -normalize(20),
},  

});