import { useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '../../../../../shared/components/Slider/CustomSlider';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    sectionCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        padding: spacing[4],
        marginTop: spacing[5],
        marginHorizontal: spacing[3],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    iconContainer: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[2],
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[3],
    },
    sectionHeaderTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    inputGroup: {
        marginBottom: spacing[5],
    },
    inputLabel: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing[2],
    },
    input: {
        backgroundColor: colors.faded.surface,
        borderRadius: radius[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: fontSize[16],
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    inputSingle: {
        height: spacing.inputHeight,
    },
    inputMultiline: {
        minHeight: 120,
        paddingTop: spacing[3],
        textAlignVertical: 'top',
    },
    noteHelperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing[2],
    },
    noteHelper: {
        fontSize: fontSize[12],
        color: colors.text.quaternary,
    },
    charCount: {
        fontSize: fontSize[12],
        color: colors.text.quaternary,
    },
    labelWithAction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[1],
    },
    clearButton: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
    },
    clearButtonText: {
        fontSize: fontSize[12],
        color: colors.accent.primary,
        fontWeight: fontWeight.semibold,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayButton: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[5],
        backgroundColor: colors.faded.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    dayButtonSelected: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    dayButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
    },
    dayButtonTextSelected: {
        color: colors.accent.buttonText,
        fontWeight: fontWeight.bold,
    },
}));

const DAYS_OF_WEEK = [
    { id: 'monday', label: 'M' },
    { id: 'tuesday', label: 'T' },
    { id: 'wednesday', label: 'W' },
    { id: 'thursday', label: 'T' },
    { id: 'friday', label: 'F' },
    { id: 'saturday', label: 'S' },
    { id: 'sunday', label: 'S' },
];

export const BasicInfoStep = ({ templateName, setTemplateName, note, setNote, duration, setDuration, preferredDays = [], setPreferredDays }) => {
    const handleSlidingComplete = useCallback((value) => setDuration(value), [setDuration]);

    const handleDayToggle = useCallback((dayId) => {
        setPreferredDays(prev =>
            prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
        );
    }, [setPreferredDays]);

    const clearAllDays = useCallback(() => setPreferredDays([]), [setPreferredDays]);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconContainer}>
                            <Feather name="edit" size={spacing.iconMd} color={colors.accent.buttonText} />
                        </View>
                        <Text style={styles.sectionHeaderTitle}>Workout Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Workout Name</Text>
                        <TextInput
                            style={[styles.input, styles.inputSingle]}
                            placeholder="Enter workout name"
                            placeholderTextColor={colors.text.quaternary}
                            value={templateName}
                            onChangeText={setTemplateName}
                            returnKeyType="next"
                            maxLength={30}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            placeholder="Describe your workout goals and focus areas..."
                            placeholderTextColor={colors.text.quaternary}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={200}
                        />
                        <View style={styles.noteHelperContainer}>
                            <Text style={styles.noteHelper}>Be specific about your goals</Text>
                            <Text style={styles.charCount}>{note.length} / 200</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelWithAction}>
                            <Text style={styles.inputLabel}>Preferred Days</Text>
                            {preferredDays.length > 0 && (
                                <TouchableOpacity onPress={clearAllDays} style={styles.clearButton}>
                                    <Text style={styles.clearButtonText}>Clear all</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.daysContainer}>
                            {DAYS_OF_WEEK.map(day => (
                                <TouchableOpacity
                                    key={day.id}
                                    style={[styles.dayButton, preferredDays.includes(day.id) && styles.dayButtonSelected]}
                                    onPress={() => handleDayToggle(day.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dayButtonText, preferredDays.includes(day.id) && styles.dayButtonTextSelected]}>
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Estimated Duration</Text>
                        <Slider
                            minimumValue={0}
                            maximumValue={150}
                            step={1}
                            value={duration}
                            onSlidingComplete={handleSlidingComplete}
                            minimumTrackTintColor={colors.accent.primary}
                            maximumTrackTintColor={colors.border.light}
                            thumbTintColor={colors.accent.primary}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default BasicInfoStep;