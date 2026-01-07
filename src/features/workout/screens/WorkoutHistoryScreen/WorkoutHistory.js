import { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkoutContext } from '../../context/WorkoutContext';
import { findBestSet } from '../../handlers/WorkoutHandler';
import styles from './WorkoutHistoryStyles';

const WorkoutHistoryScreen = ({ navigation }) => {
  const { workoutHistory } = useContext(WorkoutContext);
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getDurationInMinutes = (duration) => {
    const [hours, minutes] = duration.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };

  const calculateTotalSets = (exercises) => {
    return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>History</Text>
        
        {workoutHistory && workoutHistory.length > 0 ? (
          workoutHistory.map((item, index) => {
            const isExpanded = expandedCards[index];
            const exercises = item.exercises || [];
            const displayExercises = isExpanded ? exercises : exercises.slice(0, 5);
            const hasMore = exercises.length > 5;
            const totalSets = calculateTotalSets(exercises);
            const durationMinutes = getDurationInMinutes(item.duration);
            const workoutTitle = item.workoutName || 'Workout';

            return (
              <View key={index} style={styles.workoutCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.workoutTitle}>{workoutTitle}</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#FF9500" />
                        <Text style={styles.statText}>{durationMinutes} min</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="dumbbell" size={14} color="#FF9500" />
                        <Text style={styles.statText}>{exercises.length} exercises</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="counter" size={14} color="#FF9500" />
                        <Text style={styles.statText}>{totalSets} sets</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.dateText}>
                      {formatDate(item.timestamp)}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatTime(item.timestamp)}
                    </Text>
                    {item.totalPRs > 0 && (
                      <View style={styles.prBadge}>
                        <MaterialCommunityIcons name="trophy-variant" size={14} color="#FF9500" />
                        <Text style={styles.prText}>{item.totalPRs}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.exercisesList}>
                  {displayExercises.map((exercise, exIndex) => {
                    const bestSet = findBestSet(exercise.sets);
                    const isLast = exIndex === displayExercises.length - 1 && !hasMore;
                    return (
                      <View key={exIndex} style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}>
                        <View style={styles.exerciseLeft}>
                          <Text style={styles.exerciseName} numberOfLines={1}>
                            {exercise.exerciseName}
                          </Text>
                          <Text style={styles.exerciseSets}>
                            {exercise.sets.length} sets
                          </Text>
                        </View>
                        <View style={styles.bestSetBadge}>
                          <Text style={styles.bestSetText}>
                            {bestSet.weight && bestSet.reps ? `${bestSet.weight}kg × ${bestSet.reps}` : '-'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  
                  {hasMore && (
                    <TouchableOpacity 
                      style={styles.showMoreButton}
                      onPress={() => toggleExpand(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.showMoreText}>
                        {isExpanded ? 'Show less' : `+${exercises.length - 5} more`}
                      </Text>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color="#06B6D4" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="history" size={56} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No workout history yet</Text>
            <Text style={styles.emptySubtitle}>
              Your completed workouts will appear here.{'\n'}Start your first workout to track your progress!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutHistoryScreen;