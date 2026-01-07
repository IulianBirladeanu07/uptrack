import { useState, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: 'rgba(255, 255, 255, 0.05)',
  surfaceAlpha: 'rgba(31, 41, 55, 0.5)',
  primary: '#FF9500',
  primaryDark: '#E68600',
  primaryAlpha: 'rgba(255, 149, 0, 0.3)',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF4444',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textMuted: '#4B5563',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',
};

const formatRestTime = (seconds) => {
  if (!seconds) return '3m';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
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
      : [];

    const [expandedExercise, setExpandedExercise] = useState(null);

    const toggleExercise = (index) => {
      setExpandedExercise(expandedExercise === index ? null : index);
    };

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={normalize(24)} color={COLORS.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{templateName}</Text>
              <Text style={styles.headerSubtitle}>Review your workout</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="fitness" size={normalize(18)} color={COLORS.primary} />
              <Text style={styles.statValue}>{exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="repeat" size={normalize(18)} color={COLORS.cyan} />
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>Total Sets</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="time" size={normalize(18)} color={COLORS.success} />
              <Text style={styles.statValue}>{duration}m</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="timer" size={normalize(18)} color={COLORS.purple} />
              <Text style={styles.statValue}>{formatRestTime(avgRestTime)}</Text>
              <Text style={styles.statLabel}>Avg Rest</Text>
            </View>
          </View>
        </View>

        {muscleGroups.length > 0 && (
          <View style={styles.muscleGroupsCard}>
            <Text style={styles.muscleGroupsLabel}>TARGET MUSCLES</Text>
            <View style={styles.muscleGroupsList}>
              {muscleGroups.map((muscle, idx) => (
                <View key={idx} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {note && (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>WORKOUT NOTE</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}

        <View style={styles.exercisesSection}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.exercisesTitle}>Exercise List</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setCurrentStep(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={normalize(16)} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={normalize(48)} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No exercises added yet</Text>
            </View>
          ) : (
            <View style={styles.exercisesList}>
              {exercises.map((exercise, index) => {
                const exerciseName = exercise?.name || exercise?.exerciseName || 'Unnamed Exercise';
                const muscleGroup = exercise?.muscleGroup || 'N/A';
                const imageSource = exercise?.imageURL || exercise?.image
                  ? { uri: exercise.imageURL || exercise.image }
                  : null;
                const isExpanded = expandedExercise === index;
                const hasNote = exercise?.note || exercise?.notes;

                return (
                  <TouchableOpacity
                    key={`exercise-${index}`}
                    style={styles.exerciseCard}
                    onPress={() => hasNote && toggleExercise(index)}
                    activeOpacity={hasNote ? 0.7 : 1}
                  >
                    <View style={styles.exerciseRow}>
                      <View style={styles.exerciseImageContainer}>
                        {imageSource ? (
                          <Image
                            source={imageSource}
                            style={styles.exerciseImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name="barbell"
                            size={normalize(20)}
                            color={COLORS.textMuted}
                          />
                        )}
                      </View>
                      
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                          {exerciseName}
                        </Text>
                        <View style={styles.exerciseMeta}>
                          <Text style={styles.exerciseMetaText}>{muscleGroup}</Text>
                          {exercise?.numSets && exercise?.repRange && (
                            <>
                              <View style={styles.metaSeparator} />
                              <Text style={styles.exerciseMetaText}>
                                {exercise.numSets} × {exercise.repRange}
                              </Text>
                            </>
                          )}
                          {exercise?.restTime && (
                            <>
                              <View style={styles.metaSeparator} />
                              <Text style={styles.exerciseMetaText}>
                                {formatRestTime(exercise.restTime)} rest
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                      {hasNote && (
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={normalize(16)}
                          color={COLORS.textSecondary}
                        />
                      )}
                    </View>

                    {isExpanded && hasNote && (
                      <View style={styles.exerciseNoteContainer}>
                        <Text style={styles.exerciseNoteLabel}>NOTE</Text>
                        <Text style={styles.exerciseNoteText}>
                          {exercise.note || exercise.notes}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: normalize(12),
    paddingBottom: normalize(100),
  },
  headerSection: {
    marginTop: normalize(8),
    marginBottom: normalize(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(2),
  },
  headerSubtitle: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: normalize(12),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: normalize(12),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: normalize(8),
    marginBottom: normalize(2),
  },
  statLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  muscleGroupsCard: {
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: normalize(12),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: normalize(12),
  },
  muscleGroupsLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: normalize(10),
  },
  muscleGroupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  muscleChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: normalize(20),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  muscleChipText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noteCard: {
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: normalize(12),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: normalize(12),
  },
  noteLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: normalize(8),
  },
  noteText: {
    fontSize: normalize(14),
    color: COLORS.textPrimary,
    lineHeight: normalize(20),
  },
  exercisesSection: {
    marginTop: normalize(8),
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  exercisesTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    marginTop: normalize(12),
  },
  exercisesList: {
    gap: normalize(10),
  },
  exerciseCard: {
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: normalize(12),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImageContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
    padding: normalize(4),
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(8),
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(4),
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  exerciseMetaText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  metaSeparator: {
    width: normalize(4),
    height: normalize(4),
    borderRadius: normalize(2),
    backgroundColor: COLORS.textTertiary,
    marginHorizontal: normalize(6),
  },
  exerciseNoteContainer: {
    marginTop: normalize(12),
    paddingTop: normalize(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  exerciseNoteLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: normalize(6),
  },
  exerciseNoteText: {
    fontSize: normalize(13),
    color: COLORS.textPrimary,
    lineHeight: normalize(18),
  },
});

export default ReviewStep;