import { useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '../../../../../shared/components/Slider/CustomSlider';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { StyleSheet } from 'react-native';

const COLORS = {
  primary: '#ff8535',
  primaryDark: '#0284C7',
  secondary: '#02111B',
  background: '#02111B',
  cardDark: 'rgba(15, 23, 42, 0.8)',
  card: 'rgba(30, 41, 59, 0.4)',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.05)',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',
};

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon', fullName: 'Monday' },
  { id: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { id: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { id: 'friday', label: 'Fri', fullName: 'Friday' },
  { id: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { id: 'sunday', label: 'Sun', fullName: 'Sunday' },
];

export const BasicInfoStep = memo(
  ({ templateName, setTemplateName, note, setNote, duration, setDuration, preferredDays = [], setPreferredDays }) => {
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
                    <Feather name="edit" size={normalize(20)} color="#212121" />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>Workout Details</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={[styles.input, styles.workoutNameInput]}
                  placeholder="Enter workout name"
                  placeholderTextColor={COLORS.textMuted}
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
                  placeholderTextColor={COLORS.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
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
                <Text style={styles.dayHelper}>
                  {preferredDays.length === 0 
                    ? 'Select your preferred workout days (optional)'
                    : `Selected: ${preferredDays.map(id => 
                        DAYS_OF_WEEK.find(day => day.id === id)?.fullName
                      ).join(', ')}`
                  }
                </Text>
              </View>

              <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Estimated Duration</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={150}
                  step={1}
                  value={duration}
                  onSlidingComplete={handleSlidingComplete}
                  minimumTrackTintColor={COLORS.primaryDark}
                  maximumTrackTintColor={COLORS.divider}
                  thumbTintColor={COLORS.primaryDark}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.templateName === nextProps.templateName &&
      prevProps.note === nextProps.note &&
      prevProps.workoutType === nextProps.workoutType &&
      prevProps.duration === nextProps.duration &&
      JSON.stringify(prevProps.preferredDays) === JSON.stringify(nextProps.preferredDays)
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    // padding: normalize(10),
  },
  sectionCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: normalize(12),
    padding: normalize(16),
    marginVertical: normalize(12),
    borderWidth: normalize(1),
    borderColor: COLORS.borderDivider,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orangeIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  sectionHeaderTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: normalize(18),
  },
  inputLabel: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: normalize(12),
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    fontSize: normalize(16),
    color: COLORS.textPrimary,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  workoutNameInput: {
    height: normalize(50),
  },
  notesInput: {
    minHeight: normalize(120),
    paddingVertical: normalize(12),
    textAlignVertical: 'top',
  },
  noteHelperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(4),
    marginBottom: normalize(2),
  },
  noteHelper: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
  },
  charCount: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: normalize(4),
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  clearButton: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
  },
  clearButtonText: {
    fontSize: normalize(12),
    color: COLORS.primary,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
    marginBottom: normalize(8),
  },
  dayButton: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    minWidth: normalize(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.accentPrimaryFaded,
    borderColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  dayButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dayHelper: {
    fontSize: normalize(11),
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: normalize(16),
  },
});

export default BasicInfoStep;