import { StyleSheet, Platform } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  background: '#0A0E13', // Deep slate
  cardBackground: '#151B23',
  inputBackground: '#151B23',
  accent: '#f97316', // Vibrant Orange
  text: '#FFFFFF',
  textSecondary: '#94a3b8',
  purple: '#A855F7',
  green: '#22C55E',
  blue: '#3B82F6',
  border: '#334155',
  error: '#ef4444',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: normalize(20),
    paddingTop: normalize(40),
  },
  header: {
    color: COLORS.text,
    fontSize: normalize(24),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: normalize(24),
  },
  inputWrapper: {
    marginBottom: normalize(20),
  },
  labelContainer: {
    marginBottom: normalize(8),
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: normalize(13),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: normalize(15),
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: normalize(12),
    marginTop: normalize(6),
    marginLeft: normalize(4),
  },
  inputIcon: {
    marginRight: normalize(12),
  },
  section: {
    marginTop: normalize(10),
    marginBottom: normalize(30),
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: normalize(17),
    fontWeight: '700',
    marginBottom: normalize(16),
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otherNutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: normalize(10),
  },
  nutrientHeader: {
    marginBottom: normalize(8),
  },
  labelWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  nutrientCell: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    height: normalize(48),
    paddingHorizontal: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  nutrientInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: normalize(14),
    fontWeight: '700',
  },
  nutrientHeaderLabel: {
    color: COLORS.textSecondary,
    fontSize: normalize(12),
    fontWeight: '600',
  },
  unitText: {
    color: COLORS.textSecondary,
    fontSize: normalize(12),
    fontWeight: '700',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: normalize(14),
    padding: normalize(4),
    marginBottom: normalize(24),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(10),
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: normalize(14),
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.background,
  },
  footer: {
    padding: normalize(20),
    paddingBottom: Platform.OS === 'ios' ? normalize(30) : normalize(20),
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amountRow: {
    flexDirection: 'row',
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  amountInput: {
    flex: 1.5,
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    height: normalize(50),
    color: COLORS.text,
    fontSize: normalize(15),
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitSelector: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: normalize(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: normalize(56),
    gap: normalize(8),
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.textSecondary,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: normalize(16),
    fontWeight: '800',
  },
});

export { COLORS, styles };