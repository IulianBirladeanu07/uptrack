import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  background: '#0f172a',
  cardBackground: '#1e293b',
  inputBackground: 'rgba(30, 41, 59, 0.5)',
  accent: '#f97316',
  text: '#FFFFFF',
  textSecondary: '#94a3b8',
  purple: '#6B4BA3',
  green: '#3F725B',
  blue: '#394B6B',
  border: '#334155',
  error: '#ef4444',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: normalize(20),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: normalize(20),
  },
  header: {
    color: COLORS.text,
    fontSize: normalize(24),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: normalize(16),
  },
  inputWrapper: {
    marginBottom: normalize(16),
  },
  labelContainer: {
    marginBottom: normalize(8),
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: normalize(14),
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(6),
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: normalize(14),
    paddingHorizontal: normalize(12),
  },
  errorText: {
    color: COLORS.error,
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
  inputIcon: {
    marginRight: normalize(8),
  },
  section: {
    marginBottom: normalize(16),
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: normalize(18),
    fontWeight: '700',
    marginBottom: normalize(12),
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(8),
  },
  otherNutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: normalize(8),
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
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  nutrientInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: normalize(12),
  },
  nutrientHeaderLabel: {
    color: COLORS.textSecondary,
    fontSize: normalize(12),
    fontWeight: '500',
  },
  unitText: {
    color: COLORS.textSecondary,
    fontSize: normalize(12),
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    padding: normalize(4),
    marginBottom: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.background,
  },
  footer: {
    padding: normalize(16),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amountRow: {
    flexDirection: 'row',
    gap: normalize(12),
    marginBottom: normalize(12),
  },
  amountInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    color: COLORS.text,
    fontSize: normalize(14),
  },
  unitSelector: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: normalize(16),
    gap: normalize(8),
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: normalize(16),
    fontWeight: '700',
  },
});

export { COLORS, styles };