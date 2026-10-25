import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { formatDate as formatDateKey } from '../../utils/dateUtils';
import type { DisplayEntry } from '../../helpers/weightTrackerUtils';
import { formatWeightDate } from './weightTrackerPresentation';

type WeightEntryModalProps = {
    visible: boolean;
    bottomInset: number;
    modalDate: Date;
    dateOptions: Date[];
    entries: DisplayEntry[];
    selected: boolean;
    weightInput: string;
    isValid: boolean;
    saving: boolean;
    onClose: () => void;
    onSelectDate: (date: Date) => void;
    onInputFocus: () => void;
    onAdjust: (delta: number) => void;
    onLongPress: (delta: number) => void;
    onPressOut: () => void;
    onKeypadPress: (key: string) => void;
    onSave: () => void;
};

type DatePillProps = {
    date: Date;
    label: string;
    isSelected: boolean;
    hasEntry: boolean;
    onPress: () => void;
};

type KeypadProps = { onPress: (key: string) => void };

const KEYPAD_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
];

const DatePill = ({ date, label, isSelected, hasEntry, onPress }: DatePillProps) => (
    <TouchableOpacity
        style={[styles.datePill, isSelected && styles.datePillSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.datePillDay, isSelected && styles.datePillDaySelected]}>{label}</Text>
        <Text style={[styles.datePillNum, isSelected && styles.datePillNumSelected]}>{date.getDate()}</Text>
        <View style={[styles.datePillDot, hasEntry && (isSelected ? styles.datePillDotOnSelected : styles.datePillDotFilled)]} />
    </TouchableOpacity>
);

const Keypad = ({ onPress }: KeypadProps) => (
    <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, i) => (
            <View key={i} style={styles.keypadRow}>
                {row.map(key => (
                    <TouchableOpacity
                        key={key}
                        style={styles.keypadKey}
                        onPress={() => onPress(key)}
                        activeOpacity={0.6}
                    >
                        {key === 'backspace'
                            ? <Ionicons name="backspace-outline" size={20} color={colors.text.primary} />
                            : <Text style={styles.keypadKeyText}>{key}</Text>}
                    </TouchableOpacity>
                ))}
            </View>
        ))}
    </View>
);

const WeightEntryModal = ({
    visible,
    bottomInset,
    modalDate,
    dateOptions,
    entries,
    selected,
    weightInput,
    isValid,
    saving,
    onClose,
    onSelectDate,
    onInputFocus,
    onAdjust,
    onLongPress,
    onPressOut,
    onKeypadPress,
    onSave,
}: WeightEntryModalProps) => {
    const showError = !isValid && weightInput !== '';
    const isExistingEntry = entries.some(entry => entry.dateKey === formatDateKey(modalDate));
    const lastEntry = entries[0];

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={[styles.modalSheet, { paddingBottom: bottomInset + spacing[4] }]}
                    onPress={event => event.stopPropagation()}
                >
                    <View style={styles.modalHandle} />
                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Log Weight</Text>
                                <Text style={styles.modalSubtitle}>{formatWeightDate(modalDate)}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateStrip}>
                            {dateOptions.map(date => {
                                const key = formatDateKey(date);
                                const formatted = formatWeightDate(date);
                                const label = formatted === 'Today' ? 'Today'
                                    : formatted === 'Yesterday' ? 'Yest'
                                    : date.toLocaleDateString('en-US', { weekday: 'short' });
                                return (
                                    <DatePill
                                        key={key}
                                        date={date}
                                        label={label}
                                        isSelected={date.toDateString() === modalDate.toDateString()}
                                        hasEntry={entries.some(entry => entry.dateKey === key)}
                                        onPress={() => onSelectDate(date)}
                                    />
                                );
                            })}
                        </View>

                        {lastEntry && (
                            <View style={styles.lastLogged}>
                                <View style={styles.lastLoggedInner}>
                                    <View>
                                        <Text style={styles.lastLoggedLabel}>Last logged</Text>
                                        <View style={styles.lastLoggedRow}>
                                            <Text style={styles.lastLoggedWeight}>{lastEntry.weight.toFixed(1)}</Text>
                                            <Text style={styles.lastLoggedUnit}> kg</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.lastLoggedDate}>{formatWeightDate(lastEntry.date)}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.stepperRow}>
                            <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => onAdjust(-0.1)}
                                onLongPress={() => onLongPress(-0.1)}
                                onPressOut={onPressOut}
                                delayLongPress={400}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="remove" size={24} color={colors.text.primary} />
                            </TouchableOpacity>

                            <View style={styles.weightInputRow}>
                                <Pressable
                                    onPress={onInputFocus}
                                    hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                                    style={[styles.weightInputBox, selected && styles.weightInputBoxSelected]}
                                >
                                    <Text style={[styles.weightInput, showError && styles.weightInputError]}>
                                        {weightInput || '0.0'}
                                    </Text>
                                </Pressable>
                                <Text style={[styles.weightUnit, showError && styles.weightUnitError]}>kg</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => onAdjust(0.1)}
                                onLongPress={() => onLongPress(0.1)}
                                onPressOut={onPressOut}
                                delayLongPress={400}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.updateHint, !isExistingEntry && styles.updateHintHidden]}>
                            updates existing entry
                        </Text>
                        <Keypad onPress={onKeypadPress} />

                        <TouchableOpacity
                            style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
                            onPress={onSave}
                            disabled={!isValid || saving}
                            activeOpacity={0.8}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color={colors.accent.buttonText} />
                                : <Ionicons
                                    name={isExistingEntry ? 'refresh' : 'checkmark-circle'}
                                    size={18}
                                    color={(!isValid || saving) ? colors.text.quaternary : colors.accent.buttonText}
                                  />
                            }
                            <Text style={[styles.saveBtnText, (!isValid || saving) && styles.saveBtnTextDisabled]}>
                                {saving
                                    ? (isExistingEntry ? 'Updating...' : 'Saving...')
                                    : (isExistingEntry ? 'Update Entry' : 'Save Entry')}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = createStyles(() => ({
    modalOverlay: { flex: 1, backgroundColor: colors.background.overlay, justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: radius[5],
        borderTopRightRadius: radius[5],
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border.default,
        paddingHorizontal: spacing[5],
        maxHeight: '85%',
    },
    modalHandle: {
        width: spacing[9],
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border.default,
        alignSelf: 'center',
        marginVertical: spacing[3],
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        marginBottom: spacing[4],
    },
    modalTitle: { fontSize: fontSize[20], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.3 },
    modalSubtitle: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: 2 },
    modalCloseBtn: {
        width: spacing[8],
        height: spacing[8],
        borderRadius: radius[2],
        backgroundColor: colors.faded.surfaceMedium,
        borderWidth: 1,
        borderColor: colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateStrip: { flexDirection: 'row', gap: spacing[2], paddingVertical: spacing[1], marginBottom: spacing[4] },
    datePill: {
        flex: 1,
        paddingVertical: spacing[3],
        borderRadius: radius[3],
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderColor: colors.border.default,
        alignItems: 'center',
        gap: spacing[1],
    },
    datePillSelected: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    datePillDay: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, textTransform: 'uppercase', letterSpacing: 0.4 },
    datePillDaySelected: { color: colors.accent.buttonText },
    datePillNum: { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    datePillNumSelected: { color: colors.accent.buttonText },
    datePillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 2 },
    datePillDotFilled: { backgroundColor: colors.accent.primary },
    datePillDotOnSelected: { backgroundColor: colors.accent.buttonText },
    lastLogged: {
        backgroundColor: colors.background.tertiary,
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        marginBottom: spacing[4],
    },
    lastLoggedInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    lastLoggedLabel: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.accent.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[1] },
    lastLoggedRow: { flexDirection: 'row', alignItems: 'baseline' },
    lastLoggedWeight: { fontSize: fontSize[22], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    lastLoggedUnit: { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.secondary },
    lastLoggedDate: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4], marginBottom: spacing[1] },
    stepperBtn: { width: spacing[12], height: spacing[12], borderRadius: radius[5], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    weightInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1] },
    weightInputBox: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderBottomWidth: 2, borderBottomColor: colors.border.default },
    weightInputBoxSelected: { borderBottomColor: colors.accent.primary },
    weightInput: { fontSize: fontSize[56], fontWeight: fontWeight.black, color: colors.text.primary, textAlign: 'center', minWidth: spacing[28], letterSpacing: -4, includeFontPadding: false },
    weightInputError: { color: colors.accent.error },
    weightUnit: { fontSize: fontSize[20], fontWeight: fontWeight.semibold, color: colors.text.secondary },
    weightUnitError: { color: colors.accent.error },
    updateHint: { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary, letterSpacing: 0.2, textAlign: 'center', marginBottom: spacing[4] },
    updateHintHidden: { opacity: 0 },
    keypad: { gap: spacing[2], marginBottom: spacing[4] },
    keypadRow: { flexDirection: 'row', gap: spacing[2] },
    keypadKey: { flex: 1, height: spacing[12], borderRadius: radius[3], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    keypadKeyText: { fontSize: fontSize[24], fontWeight: fontWeight.bold, color: colors.text.primary },
    saveBtn: { backgroundColor: colors.accent.primary, borderRadius: radius[3], paddingVertical: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
    saveBtnDisabled: { backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
    saveBtnText: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText, letterSpacing: 0.3 },
    saveBtnTextDisabled: { color: colors.text.quaternary },
}));

export default WeightEntryModal;
