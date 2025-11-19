import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles from '../WorkoutLibraryScreenStyle';

const TemplateItem = React.memo(({ item, expandedCards, onToggleExpanded, onEdit, onStart, formatDate }) => {
  const template = item.data || item;
  const templateId = template.id || item.id;
  const exerciseCount = template.exerciseCount || (template.exercises?.length || 0);
  const duration = template.duration || 'N/A';
  const exercises = template.exercises || [];
  const isExpanded = expandedCards[templateId];
  const displayExercises = isExpanded ? exercises : exercises.slice(0, 3);
  const hasMoreExercises = exercises.length > 3;

  const renderExerciseItem = useCallback(({ item, index }) => {
    const exerciseName = item.exerciseName || item.name || 'Exercise';
    const muscleGroup = item.muscleGroup || 'N/A';
    const imageURL = item.imageURL;
    const isLastItem = index === displayExercises.length - 1 || (!isExpanded && index === 2);

    return (
      <View style={[styles.exerciseItem, isLastItem && styles.exerciseItemLast]}>
        <View style={styles.exerciseImageContainer}>
          <Image
            source={{ uri: imageURL }}
            style={styles.exerciseImage}
            resizeMode="cover"
            onError={(error) => console.log('Failed to load image:', imageURL, error)}
          />
        </View>
        <View style={styles.exerciseDetails}>
          <View style={styles.exerciseInfoContainer}>
            <Text style={styles.exerciseName} numberOfLines={1}>{exerciseName}</Text>
            <Text style={styles.exerciseMuscleGroup}>{muscleGroup}</Text>
          </View>
          <Text style={styles.setReps}>
            {item.numSets && item.repRange ? `${item.numSets} x ${item.repRange}` : '4 × 6-10'}
          </Text>
        </View>
      </View>
    );
  }, [displayExercises.length, isExpanded]);

  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutHeaderLeft}>
          <Text style={styles.workoutTitle}>{template.templateName || 'Workout Template'}</Text>
          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={normalize(14)} color={styles.metaItemText.color} />
              <Text style={styles.metaItemText}>{duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={normalize(14)} color={styles.metaItemText.color} />
              <Text style={styles.metaItemText}>{exerciseCount} exercises</Text>
            </View>
          </View>
        </View>
        <View style={styles.categoryTagContainer}>
          <Text style={styles.categoryTag}>
            {formatDate(template.createdAt)}
          </Text>
        </View>
      </View>

      {exercises.length > 0 && (
        <View style={styles.exerciseList}>
          <FlatList
            data={displayExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => `exercise-${templateId}-${index}`}
            scrollEnabled={false}
            removeClippedSubviews={true}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            getItemLayout={(data, index) => ({
              length: normalize(60),
              offset: normalize(60) * index,
              index,
            })}
          />
          {hasMoreExercises && (
            <TouchableOpacity
              style={styles.showMore}
              onPress={() => onToggleExpanded(templateId)}
              accessibilityLabel={isExpanded ? 'Collapse exercise list' : 'Expand exercise list'}
            >
              <Text style={styles.showMoreText}>
                {isExpanded ? 'Show less exercises ↑' : `Show ${exercises.length - 3} more exercises ↓`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.workoutActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(template)}
          accessibilityLabel="Edit this workout template"
        >
          <Ionicons name="create-outline" size={normalize(18)} color={styles.editButtonText.color} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => onStart(template)}
          accessibilityLabel="Start workout with this template"
        >
          <Ionicons name="play" size={normalize(20)} color={styles.startButtonText.color} />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default TemplateItem;