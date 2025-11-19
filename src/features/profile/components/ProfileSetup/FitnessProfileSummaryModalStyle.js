import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  primary: 'rgba(30, 41, 59, 0.9)',
  secondary: '#1E293B',
  accent: '#FFA726',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.2)',
  overlay: 'rgba(0, 15, 30, 0.9)',
  highlight: '#263545',
  protein: '#26A69A',
  carbs: '#42A5F5',
  fats: '#FF7043',
  goalCard: 'rgba(255,255,255,0.05)',
  deleteButton: '#DC2626',
  pressedBackground: 'rgba(255, 167, 38, 0.05)',
};

const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.4,
  shadowRadius: normalize(16),
  shadowOffset: { width: 0, height: 10 },
  elevation: normalize(12),
};

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    padding: normalize(10),
    paddingTop: normalize(30),
    marginTop: normalize(30), 
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: normalize(24),
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  gradientBackground: {
    flex: 1,
    paddingVertical: normalize(25),
    paddingHorizontal: normalize(20),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: normalize(20),
    paddingBottom: normalize(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: normalize(20),
  },
  accordionContainer: {
    marginBottom: normalize(15),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondary,
    overflow: 'hidden',
    ...SHADOW,
  },
  expandedAccordion: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(15),
  },
  accordionHeaderExpanded: {
    backgroundColor: COLORS.highlight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  accordionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  collapsibleContent: {
    overflow: 'hidden',
  },
  accordionContent: {
    padding: normalize(15),
  },
  dataCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: normalize(14),
    padding: normalize(15),
    marginBottom: normalize(8),
  },
  goalCard: {
    backgroundColor: COLORS.goalCard,
    borderLeftWidth: 3,
    borderLeftColor: '#3F51B5',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  dataLabel: {
    fontSize: normalize(15),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: normalize(10),
    width: normalize(90),
  },
  dataValue: {
    fontSize: normalize(16),
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  caloriesCard: {
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
    borderRadius: normalize(14),
    padding: normalize(15),
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  caloriesLabel: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: normalize(8),
  },
  caloriesValue: {
    fontSize: normalize(26),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: normalize(5),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: normalize(12),
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: normalize(14),
    padding: normalize(12),
    flex: 1,
    marginHorizontal: normalize(4),
    alignItems: 'center',
  },
  macroIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  macroDetails: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  macroValue: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: normalize(4),
  },
  percentageContainer: {
    marginTop: normalize(4),
  },
  macroPercentage: {
    fontSize: normalize(14),
    fontWeight: '700',
  },
  noteCardContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: normalize(14),
    padding: normalize(12),
    marginBottom: normalize(12),
  },
  noteIconContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  noteTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  noteText: {
    fontSize: normalize(15),
    color: COLORS.textPrimary,
    lineHeight: normalize(22),
  },
  noNotesText: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: normalize(20),
  },
  continueButton: {
    marginTop: normalize(20),
    borderRadius: normalize(12),
    backgroundColor: COLORS.accent,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOW,
  },
  continueButtonText: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});

export { styles, COLORS, SHADOW };
