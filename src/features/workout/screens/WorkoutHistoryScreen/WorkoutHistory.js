import React, { useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { WorkoutContext } from '../../context/WorkoutContext';
import WorkoutSummary from '../../components/WorkoutSummary/WorkoutSummary';
import styles from './WorkoutHistoryStyles';

const HistoryScreen = ({ navigation }) => {
  const { workoutHistory } = useContext(WorkoutContext);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);  // Assuming Firestore timestamp
    const options = {
      weekday: 'short',   // Abbreviated weekday (e.g., "Mon")
      year: 'numeric',    // Full year (e.g., "2023")
      month: 'short',     // Abbreviated month (e.g., "Nov")
      day: 'numeric',     // Day of the month (e.g., "16")
      hour: '2-digit',    // 2-digit hour (e.g., "02")
      minute: '2-digit',  // 2-digit minutes (e.g., "45")
      hour12: true,       // 12-hour format (AM/PM)
    };
  
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
  const handleWorkoutPress = useCallback((workout) => {
    if (workout) {
      const formattedWorkoutData = {
        note: workout.note,
        exercises: workout.exercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          sets: exercise.sets.map((set) => {
            return {
              weight: set.weight.toString(),
              reps: set.reps.toString(),
              isValidated: set.isValidated,
            };
          }),
        })),
      };

      navigation.navigate('StartWorkout', { selectedWorkout: formattedWorkoutData });
    } else {
      console.error('Invalid workout data:', workout);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Workout History</Text>
      <FlatList
        data={workoutHistory}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleWorkoutPress(item)}
          >
            <WorkoutSummary
              formattedTimestamp={formatTimestamp(item.timestamp)}
              duration={item.duration}
              totalPRs={item.totalPRs || 0}
              exercises={item.exercises}
              notes={item.notes}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default HistoryScreen;
