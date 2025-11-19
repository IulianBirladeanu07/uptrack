import { useState, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  primary: '#ff8535',
  secondary: '#02111B',
  cardDark: 'rgba(15, 23, 42, 0.8)',
  card: 'rgba(30, 41, 59, 0.4)',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  success: '#10b981',
  info: '#67E8F9',
  accent2: '#00d4ff',
};

const ReviewStep = memo(
  ({
    templateName = 'Untitled Workout',
    setCurrentStep = () => {},
    exercises = [],
    note = '',
    duration = 0,
  }) => {
    const totalSets = exercises.reduce((sum, ex) => sum + parseInt(ex?.numSets || 0), 0);
    const avgRestTime = exercises.length
      ? Math.round(
          exercises.reduce((sum, ex) => sum + parseInt(ex?.restTime || 180), 0) / exercises.length
        )
      : 180;
    const muscleGroups = exercises.length
      ? [
          ...new Set(
            exercises.map((ex) => ex?.muscleGroup || 'Unknown').filter((mg) => mg !== 'Unknown')
          ),
        ]
      : [templateName];

    // State for toggling notes visibility per exercise
    const [expandedNotes, setExpandedNotes] = useState({});

    // Toggle notes visibility for a specific exercise
    const toggleNotes = (index) => {
      setExpandedNotes((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
    };

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: normalize(100), paddingHorizontal: normalize(16) }}
      >
        {/* Workout Overview Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.orangeIconContainer}>
                <Feather name="info" size={normalize(20)} color="#212121" />
              </View>
              <Text style={styles.sectionHeaderTitle}>Workout Overview</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setCurrentStep(0)}
              activeOpacity={0.7}
              accessible
              accessibilityLabel="Edit workout details"
              accessibilityHint="Navigates to edit workout details"
            >
              <MaterialIcons name="edit" size={normalize(16)} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="activity" size={normalize(16)} color={COLORS.primary} />
              </View>
              <Text style={styles.statLabel}>Exercises</Text>
              <Text style={styles.statValue}>{exercises.length}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="clock" size={normalize(16)} color={COLORS.info} />
              </View>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{duration} min</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name="target" size={normalize(16)} color={COLORS.success} />
              </View>
              <Text style={styles.statLabel}>Total Sets</Text>
              <Text style={styles.statValue}>{totalSets}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="timer" size={normalize(16)} color={COLORS.accent2} />
              </View>
              <Text style={styles.statLabel}>Avg Rest</Text>
              <Text style={styles.statValue}>{avgRestTime}s</Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.statLabel}>Muscle Groups</Text>
              <Text style={[styles.detailValue, { color: COLORS.success }]}>
                {muscleGroups.slice(0, 3).join(', ')}
                {muscleGroups.length > 3 ? '...' : ''}
              </Text>
            </View>
          </View>
          {note && (
            <View style={[styles.descriptionBox, { backgroundColor: COLORS.card }]}>
              <Text style={styles.statLabel}>Description</Text>
              <Text style={styles.descriptionText}>{note}</Text>
            </View>
          )}
        </View>

        {/* Divider Between Sections */}
        <View style={styles.divider} />

        {/* Exercise Breakdown Card */}
        <View style={styles.workoutCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.orangeIconContainer}>
                <Feather name="list" size={normalize(20)} color="#212121" />
              </View>
              <Text style={styles.sectionHeaderTitle}>Exercise Breakdown</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setCurrentStep(1)}
              activeOpacity={0.7}
              accessible
              accessibilityLabel="Edit exercises"
              accessibilityHint="Navigates to edit exercises"
            >
              <MaterialIcons name="edit" size={normalize(16)} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseList}>
            {exercises.length === 0 ? (
              <View style={styles.emptyExerciseContainer}>
                <Feather name="clipboard" size={normalize(36)} color={COLORS.textSecondary} />
                <Text style={styles.emptyExerciseText}>
                  No exercises added yet. Edit to build your workout!
                </Text>
              </View>
            ) : (
              exercises.map((exercise, index) => {
                const exerciseName = exercise?.name || exercise?.exerciseName || 'Unnamed Exercise';
                const muscleGroup = exercise?.muscleGroup || 'N/A';
                const imageSource = exercise?.imageURL || exercise?.image
                  ? { uri: exercise.imageURL || exercise.image }
                  : null;
                const isLastItem = index === exercises.length - 1;
                const isNotesExpanded = expandedNotes[index];

                return (
                  <View key={`exercise-review-${index}`} style={[styles.exerciseItem, isLastItem && styles.exerciseItemLast]}>
                    <View style={styles.exerciseImageContainer}>
                      {imageSource ? (
                        <Image
                          source={imageSource}
                          style={styles.exerciseImage}
                          resizeMode="contain"
                          onError={(error) => console.log('Failed to load image:', imageSource.uri, error)}
                          accessibilityLabel={`Image of ${exerciseName}`}
                          accessibilityHint="Visual representation of the exercise"
                        />
                      ) : (
                        <Ionicons
                          name="barbell"
                          size={normalize(24)}
                          color={COLORS.textSecondary}
                        />
                      )}
                    </View>
                    <View style={styles.exerciseDetails}>
                      <View style={styles.exerciseInfoContainer}>
                        <Text
                          style={styles.exerciseName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {exerciseName}
                        </Text>
                        <Text style={styles.exerciseMuscleGroup}>{muscleGroup}</Text>
                        {exercise?.notes && isNotesExpanded && (
                          <Text style={styles.exerciseReviewExtraValue}>
                            {exercise.notes}
                          </Text>
                        )}
                      </View>
                      <View style={styles.setRepsContainer}>
                        <Text style={styles.setReps}>
                          {exercise?.numSets && exercise?.repRange
                            ? `${exercise.numSets} x ${exercise.repRange}`
                            : 'Not specified'}
                        </Text>
                        {exercise?.notes && (
                          <TouchableOpacity
                            style={styles.showMore}
                            onPress={() => toggleNotes(index)}
                            accessibilityLabel={isNotesExpanded ? 'Hide notes' : 'Show notes'}
                            accessibilityHint={isNotesExpanded ? 'Hides exercise notes' : 'Shows notes for this exercise'}
                          >
                            <Text style={styles.showMoreText}>
                              {isNotesExpanded ? 'Hide notes ↑' : 'Show notes ↓'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Divider Between Sections */}
        <View style={styles.divider} />

        {/* Workout Summary Card */}
        <View style={[styles.sectionCard]}>
          <View style={[styles.summaryContent]}>
            <View>
              <Text style={styles.summaryTitle}>Estimated Completion Time</Text>
              <Text style={styles.summarySubtitle}>
                Based on user input and {avgRestTime}s average rest between sets
              </Text>
            </View>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: normalize(20) }]}>
                {duration}
              </Text>
              <Text style={styles.summaryUnit}>minutes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.templateName === nextProps.templateName &&
      prevProps.exercises === nextProps.exercises &&
      prevProps.note === nextProps.note &&
      prevProps.duration === nextProps.duration
    );
  }
);

const styles = StyleSheet.create({
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
  editButton: {
    padding: normalize(8),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: normalize(16),
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: normalize(10),
    padding: normalize(12),
    marginBottom: normalize(10),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconContainer: {
    marginBottom: normalize(8),
  },
  statLabel: {
    fontSize: normalize(11),
    fontWeight: '500',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: normalize(4),
  },
  statValue: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: normalize(16),
    gap: normalize(12),
  },
  detailItem: {
    minWidth: normalize(100),
  },
  detailValue: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  descriptionBox: {
    borderRadius: normalize(8),
    padding: normalize(12),
    backgroundColor: COLORS.card,
  },
  descriptionText: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    lineHeight: normalize(20),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderDivider,
  },
  workoutCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: normalize(12),
    marginVertical: normalize(12),
    padding: normalize(16),
    borderWidth: normalize(1),
    borderColor: COLORS.borderDivider,
  },
  exerciseList: {
    paddingHorizontal: normalize(12),
    paddingBottom: normalize(8),
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDivider,
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseImageContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(4),
  },
  exerciseDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  exerciseInfoContainer: {
    flex: 1,
    marginRight: normalize(12),
  },
  exerciseName: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontSize: normalize(15),
    marginBottom: normalize(4),
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  exerciseMuscleGroup: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  exerciseReviewExtraValue: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: normalize(4),
  },
  setRepsContainer: {
    alignSelf: 'flex-start',
  },
  setReps: {
    fontWeight: '500',
    color: COLORS.primary,
    fontSize: normalize(14),
  },
  showMore: {
    paddingVertical: normalize(12),
    alignItems: 'center',
    marginTop: normalize(8),
  },
  showMoreText: {
    fontSize: normalize(12),
    color: COLORS.accent2,
    fontWeight: 'bold',
  },
  emptyExerciseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
  },
  emptyExerciseText: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: normalize(12),
    lineHeight: normalize(20),
    maxWidth: '80%',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.primary,
  },
  summarySubtitle: {
    fontSize: normalize(11),
    color: COLORS.textSecondary,
    marginTop: normalize(4),
  },
  summaryValueContainer: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryUnit: {
    fontSize: normalize(11),
    color: COLORS.textSecondary,
  }
}
);

export default ReviewStep;