import { useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '../../../../../shared/components/Slider/CustomSlider';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'M', fullName: 'Monday' },
  { id: 'tuesday', label: 'T', fullName: 'Tuesday' },
  { id: 'wednesday', label: 'W', fullName: 'Wednesday' },
  { id: 'thursday', label: 'T', fullName: 'Thursday' },
  { id: 'friday', label: 'F', fullName: 'Friday' },
  { id: 'saturday', label: 'S', fullName: 'Saturday' },
  { id: 'sunday', label: 'S', fullName: 'Sunday' },
];

export const BasicInfoStep = ({ templateName, setTemplateName, note, setNote, duration, setDuration, preferredDays = [], setPreferredDays }) => {
    const handleSlidingComplete = useCallback(
      (value) => {
        setDuration(value);
      },
      [setDuration]
    );

    const handleDayToggle = useCallback(
      (dayId) => {
        setPreferredDays(prev => {
          if (prev.includes(dayId)) {
            return prev.filter(id => id !== dayId);
          } else {
            return [...prev, dayId];
          }
        });
      },
      [setPreferredDays]
    );

    const clearAllDays = useCallback(() => {
      setPreferredDays([]);
    }, [setPreferredDays]);

    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.orangeIconContainer}>
                    <Feather name="edit" size={normalize(20)} color={colors.bg} />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>Workout Details</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={[styles.input, styles.workoutNameInput]}
                  placeholder="Enter workout name"
                  placeholderTextColor={colors.textTertiary}
                  value={templateName}
                  onChangeText={setTemplateName}
                  returnKeyType="next"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Describe your workout goals and focus areas..."
                  placeholderTextColor={colors.textTertiary}
                  value={note}
                  onChangeText={setNote}
                  multiline={true}
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
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayButton,
                        preferredDays.includes(day.id) && styles.dayButtonSelected
                      ]}
                      onPress={() => handleDayToggle(day.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        preferredDays.includes(day.id) && styles.dayButtonTextSelected
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                 <Text style={styles.durationLabel}>Estimated Duration</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={150}
                  step={1}
                  value={duration}
                  onSlidingComplete={handleSlidingComplete}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.borderLight}
                  thumbTintColor={colors.primary}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(18),
    padding: normalize(18),
    marginTop: normalize(20),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(24),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orangeIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  sectionHeaderTitle: {
    fontSize: normalize(17),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: normalize(20),
  },
  inputLabel: {
    fontSize: normalize(15),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: normalize(10),
  },
  durationLabel: {
    fontSize: normalize(15),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: normalize(5)
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    fontSize: normalize(16),
    color: colors.textPrimary,
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  workoutNameInput: {
    height: normalize(52),
  },
  notesInput: {
    minHeight: normalize(120),
    paddingTop: normalize(14),
    textAlignVertical: 'top',
  },
  noteHelperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(8),
  },
  noteHelper: {
    fontSize: normalize(12),
    color: colors.textTertiary,
  },
  charCount: {
    fontSize: normalize(12),
    color: colors.textTertiary,
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(5),
  },
  clearButton: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  clearButtonText: {
    fontSize: normalize(12),
    color: colors.primary,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  dayButtonTextSelected: {
    color: colors.bg,
    fontWeight: '700',
  },
  dayHelper: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    lineHeight: normalize(18),
  },
});

export default BasicInfoStep;