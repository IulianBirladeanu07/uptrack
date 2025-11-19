import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import styles from './WorkoutSummaryStyle';
import { findBestSet } from '../../handlers/WorkoutHandler';

const WorkoutSummary = ({ 
  formattedTimestamp, 
  duration, 
  totalPRs, 
  exercises, 
  showActions = false, 
  notes, 
  completionStatus, 
  comparisonData, 
}) => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  // Format duration as per original logic
  const formatDuration = (duration) => {
    const [hours, minutes] = duration.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "0 min";
    const formattedMinutes = minutes > 0 ? `${minutes} min` : '';
    const formattedHours = hours > 0 ? `${hours} h ` : '';
    return `${formattedHours}${formattedMinutes}`.trim();
  };

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const renderExercises = () => {
    return exercises.map((exercise, index) => {
      const bestSet = findBestSet(exercise.sets);
      return (
        <View key={index} style={styles.exerciseContainer}>
          <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
            {`${exercise.sets.length} x ${exercise.exerciseName}`}
          </Text>
          <View style={styles.bestSetContainer}>
            <Text style={styles.bestSetText}>
              {bestSet.weight && bestSet.reps ? `${bestSet.weight} kg x ${bestSet.reps} reps` : 'N/A'}
            </Text>
          </View>
        </View>
      );
    });
  };

  const handleWorkoutShare = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission required",
        "Permission to access media library is required to share images."
      );
      return;
    }

    try {
      setIsLoading(true);

      setTimeout(async () => {
        try {
          const capturedImageUri = await captureScreen({
            format: 'png',
            quality: 1,
          });

          setImageUri(capturedImageUri);

          const asset = await MediaLibrary.createAssetAsync(capturedImageUri);
          if (!asset) {
            throw new Error("Failed to save image asset.");
          }

          await Sharing.shareAsync(asset.uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your workout',
            UTI: 'public.png',
          });

          Alert.alert("Success", "Your workout has been shared successfully!");
        } catch (error) {
          console.error("Error sharing:", error);
          Alert.alert("Error", `An error occurred while sharing the workout: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error capturing:", error);
      Alert.alert("Error", `An error occurred while capturing the workout: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleHomeScreen = () => {
    navigation.replace('Workout');
  };

  return (
    <View collapsable={false} style={styles.container}> 
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollContainer}>
        <View style={styles.timestampContainer}>
            <Text style={styles.timestamp}>{formattedTimestamp}</Text>
          </View>          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="timer-outline" size={20} color="#FFA726" />
              <Text style={styles.summaryText}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="trophy-variant" size={20} color="#FFA726" />
              <Text style={styles.summaryText}>{totalPRs}</Text>
            </View>
          </View>

          <View style={styles.exercisesSection}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Exercises</Text>
              <Text style={styles.headerText}>Best Set</Text>
            </View>
            {exercises && exercises.length > 0 ? renderExercises() : <Text style={styles.sectionText}>No exercises available</Text>}
          </View>

          {notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesHeader}>Workout Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}

          {completionStatus && (
            <View style={styles.completionStatusContainer}>
              <Text style={styles.completionStatusText}>Completion Status: {completionStatus}</Text>
            </View>
          )}

          {comparisonData && (
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonHeader}>Comparison to Previous Workouts:</Text>
              <Text style={styles.comparisonText}>{comparisonData}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleWorkoutShare} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFA726" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant-outline" size={24} color="#FFA726" />
                <Text style={styles.actionButtonText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleHomeScreen}>
            <MaterialCommunityIcons name="play-circle" size={24} color="#FFA726" />
            <Text style={styles.actionButtonText}>Home screen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default WorkoutSummary;
