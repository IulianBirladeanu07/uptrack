import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../theme';
import { createStyles } from '../../theme/createStyles';

export const OptionRow = ({ option, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionRow, selected && styles.optionRowSelected]}
    onPress={() => onPress(option.value)}
    activeOpacity={0.7}
  >
    <View style={styles.optionRowLeft}>
      <View style={[styles.optionDot, selected && styles.optionDotSelected]} />
      <View>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
        {option.desc && <Text style={styles.optionDesc}>{option.desc}</Text>}
      </View>
    </View>
    {selected && <Ionicons name="checkmark" size={18} color={colors.accent.primary} />}
  </TouchableOpacity>
);

export const NumberStepper = ({ label, value, onDecrement, onIncrement, unit }) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperControls}>
      <TouchableOpacity style={styles.stepperBtn} onPress={onDecrement} activeOpacity={0.7}>
        <Ionicons name="remove" size={20} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.stepperValueWrap}>
        <Text style={styles.stepperValue}>{value}</Text>
        <Text style={styles.stepperUnit}>{unit}</Text>
      </View>
      <TouchableOpacity style={styles.stepperBtn} onPress={onIncrement} activeOpacity={0.7}>
        <Ionicons name="add" size={20} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = createStyles(() => ({
  optionRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  optionRowSelected:   { backgroundColor: colors.faded.primaryExtraLight },
  optionRowLeft:       { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  optionDot:           { width: spacing[2], height: spacing[2], borderRadius: radius[1], backgroundColor: colors.text.quaternary },
  optionDotSelected:   { backgroundColor: colors.accent.primary },
  optionLabel:         { fontSize: fontSize[16], fontWeight: fontWeight.semibold, color: colors.text.secondary },
  optionLabelSelected: { color: colors.text.primary, fontWeight: fontWeight.bold },
  optionDesc:          { fontSize: fontSize[12], color: colors.text.quaternary, fontWeight: fontWeight.medium, marginTop: spacing[1] },
  stepperRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  stepperLabel:        { fontSize: fontSize[16], fontWeight: fontWeight.semibold, color: colors.text.primary },
  stepperControls:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepperBtn:          { width: spacing[9], height: spacing[9], borderRadius: radius[2], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, justifyContent: 'center', alignItems: 'center' },
  stepperValueWrap:    { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1], minWidth: spacing[18], justifyContent: 'center' },
  stepperValue:        { fontSize: fontSize[20], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  stepperUnit:         { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.tertiary },
}));