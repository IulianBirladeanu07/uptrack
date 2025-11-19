import { StyleSheet, Dimensions } from "react-native";
import { normalize } from "../../../../shared/hooks/useResponsive";

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E13',
  },

  backgroundContainer: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },

  backgroundImage: {
    width: width,
    height: height,
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  backgroundGradient: {
    width: width,
    height: height,
  },

  workoutCard: {
    position: 'absolute',
    width: width * 0.85,
    maxWidth: normalize(340),
    left: (width - (width * 0.85)) / 2,
    borderRadius: normalize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },

  cardGradient: {
    borderRadius: normalize(20),
    padding: normalize(16),
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },

  iconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircleBold: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  cardTitle: {
    fontSize: normalize(14),
    fontWeight: '900',
    color: '#F9FAFB',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  cardTitleMinimal: {
    color: '#FFF',
    fontSize: normalize(15),
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  cardSubtitle: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: normalize(2),
  },

  prBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(12),
  },

  prBadgeCardBold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },

  prBadgeText: {
    fontSize: normalize(10),
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  
  mainStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: normalize(16),
    paddingBottom: normalize(10),
  },

  mainStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: normalize(4),
  },

  statIconContainer: {
    marginBottom: normalize(4),
  },

  statIconContainerBold: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalize(18),
    padding: normalize(4),
  },

  mainStatValue: {
    fontSize: normalize(24),
    fontWeight: '900',
    color: '#FFF',
    marginBottom: normalize(2),
    letterSpacing: -0.5,
  },

  mainStatValueMinimal: {
    fontSize: normalize(20),
  },

  mainStatLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  mainStatDivider: {
    width: 1,
    height: normalize(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: normalize(10),
  },
  
  bestSetsSection: {
    marginBottom: normalize(10),
  },

  sectionTitle: {
    fontSize: normalize(13),
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: normalize(8),
  },

  sectionTitleBold: {
    color: '#FFF',
  },

  exercisesList: {
    gap: normalize(4),
  },

  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(4),
  },

  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: normalize(8),
  },
  
  exerciseNumber: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  
  exerciseNumberBold: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  
  exerciseNumberPR: {
    backgroundColor: 'rgba(255, 149, 0, 0.4)',
  },
  
  exerciseNumberText: {
    fontSize: normalize(10),
    fontWeight: '700',
    color: '#FFF',
  },
  
  exerciseNumberTextPR: {
    color: '#FFD700',
  },

  exerciseInfo: {
    flexDirection: 'column',
    flex: 1,
  },

  exerciseName: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#F9FAFB',
    flexShrink: 1,
  },

  exerciseBest: {
    fontSize: normalize(12),
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: -0.2,
  },
  
  prTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(2),
    backgroundColor: 'rgba(255, 149, 0, 0.3)',
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(8),
  },
  
  prTagBold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  
  prTagText: {
    fontSize: normalize(10),
    fontWeight: '800',
    color: '#FFD700',
  },

  moreText: {
    fontSize: normalize(10),
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: normalize(8),
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(10),
    paddingTop: normalize(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },

  footerText: {
    fontSize: normalize(12),
    fontWeight: '900',
    color: '#FF9500', 
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  footerTextMinimal: {
    color: '#FFF',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },

  footerStats: {},

  footerStatsText: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
  },

  dragIndicator: {
    position: 'absolute',
    top: normalize(10),
    right: normalize(10),
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF9500',
  },

  noPhotoState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(40),
  },
  
  noPhotoIconContainer: {
    marginBottom: normalize(20),
  },
  
  noPhotoIconGradient: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: normalize(45),
    alignItems: 'center',
    justifyContent: 'center',
  },

  noPhotoTitle: {
    fontSize: normalize(24),
    fontWeight: '900',
    color: '#FFF',
    marginTop: normalize(20),
    marginBottom: normalize(10),
    textAlign: 'center',
  },

  noPhotoText: {
    fontSize: normalize(14),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: normalize(22),
    marginBottom: normalize(30),
  },
  
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(15),
    marginBottom: normalize(40),
    width: '100%',
  },
  
  previewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  previewStatValue: {
    fontSize: normalize(18),
    fontWeight: '800',
    color: '#FFF',
    marginBottom: normalize(2),
  },
  
  previewStatLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  
  previewStatDivider: {
    width: 1,
    height: normalize(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  noPhotoButtons: {
    width: '100%',
    gap: normalize(15),
    alignItems: 'center',
  },

  primaryButton: {
    width: '100%',
    borderRadius: normalize(25),
    overflow: 'hidden',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(32),
    gap: normalize(10),
  },

  primaryButtonText: {
    fontSize: normalize(16),
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(20),
    gap: normalize(8),
  },
  
  secondaryButtonText: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: '#FF9500',
  },
  
  inspiredText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#64748B',
    marginTop: normalize(20),
  },

  topControls: {
    position: 'absolute',
    top: normalize(50),
    left: normalize(20),
    right: normalize(20),
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topButton: {},

  topButtonInner: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  topButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  
  styleIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  styleIndicatorText: {
    color: '#FFF',
    fontSize: normalize(12),
    fontWeight: '600',
  },

  editControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 19, 0.95)',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(15),
    paddingBottom: normalize(90), 
    borderTopLeftRadius: normalize(25),
    borderTopRightRadius: normalize(25),
    zIndex: 90,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  editControlsHandle: {
    width: normalize(40),
    height: normalize(5),
    backgroundColor: '#334155',
    borderRadius: normalize(2.5),
    alignSelf: 'center',
    marginBottom: normalize(15),
  },
  
  editHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(15),
    marginBottom: normalize(20),
  },

  editHint: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#FF9500',
  },
  
  editSectionTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#FFF',
    marginBottom: normalize(10),
    marginTop: normalize(10),
  },

  sizeButtons: {
    flexDirection: 'row',
    gap: normalize(15),
    marginBottom: normalize(20),
  },

  sizeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(10),
    borderRadius: normalize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  sizeButtonActive: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },

  sizeButtonText: {
    fontSize: normalize(16),
    fontWeight: '900',
    color: '#FFF',
  },

  sizeButtonTextActive: {
    color: '#FF9500',
  },
  
  sizeButtonLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: normalize(2),
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    paddingVertical: normalize(12),
    borderRadius: normalize(15),
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  
  resetButtonText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#FF9500',
  },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 110, 
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(20),
    paddingTop: normalize(10),
    backgroundColor: 'transparent',
  },
  
  bottomActionsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10, 14, 19, 0.95)',
    borderRadius: normalize(30),
    padding: normalize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: normalize(4),
  },
  
  bottomButtonCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  bottomButtonCircleActive: {
    backgroundColor: '#FFF',
  },

  bottomButtonText: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: normalize(4),
  },
  
  shareButtonContainer: {
    flex: 2,
    paddingHorizontal: normalize(8),
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: normalize(25),
    paddingVertical: normalize(10),
    gap: normalize(8),
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  shareButtonDisabled: {
    opacity: 0.4,
  },

  shareButtonText: {
    fontSize: normalize(14),
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});

export default styles;