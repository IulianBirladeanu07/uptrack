import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Animated } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const COLORS = {
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

const ExerciseListItem = ({
  exercise,
  index,
  handleSetsChange,
  handleRepsChange,
  handleRestBetweenSetsChange,
  handleNoteChange,
  handleDeleteExercise,
  handleReplaceExercise,
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const noteAnim = React.useRef(new Animated.Value(0)).current;

  const toggleNoteInput = () => {
    setShowNoteInput((prev) => !prev);
    Animated.timing(noteAnim, {
      toValue: showNoteInput ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const name = exercise.exerciseName || exercise.name || 'N/A';
  const muscleGroup = exercise.muscleGroup || 'N/A';

  return (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseImageContainer}>
          <Image
            source={{ uri: 'https://cdn.dribbble.com/users/589508/screenshots/17154942/media/4c7d0d0b0b8c6b7d0c3c9b0e2b4f9f7d.png' }}
            style={styles.exerciseImage}
          />
        </View>
        <View style={styles.exerciseInfoContainer}>
          <Text style={styles.exerciseName} numberOfLines={1}>{name}</Text>
          <Text style={styles.exerciseMuscleGroup}>{muscleGroup}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteExercise(index)} style={styles.deleteButton}>
          <MaterialCommunityIcons name="delete-outline" size={normalize(20)} color={COLORS.warning} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Sets"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={exercise.numSets ? String(exercise.numSets) : ''}
            onChangeText={(text) => handleSetsChange(text, index)}
          />
          <Text style={styles.inputLabel}>Sets</Text>
        </View>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Reps"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={exercise.repRange ? String(exercise.repRange) : ''}
            onChangeText={(text) => handleRepsChange(text, index)}
          />
          <Text style={styles.inputLabel}>Reps</Text>
        </View>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Rest"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            value={exercise.restBetweenSets ? String(exercise.restBetweenSets) : ''}
            onChangeText={(text) => handleRestBetweenSetsChange(text, index)}
          />
          <Text style={styles.inputLabel}>Rest (s)</Text>
        </View>
      </View>
      
      <Animated.View style={[styles.noteContainer, { height: noteAnim.interpolate({ inputRange: [0, 1], outputRange: [0, normalize(80)] }) }]}>
        {showNoteInput && (
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes for this exercise"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            value={exercise.note}
            onChangeText={(text) => handleNoteChange(text, index)}
          />
        )}
      </Animated.View>

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleReplaceExercise(index)} style={styles.replaceButton}>
          <Feather name="refresh-cw" size={normalize(12)} color={COLORS.primary} />
          <Text style={styles.replaceText}>Replace</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleNoteInput} style={styles.noteButton}>
          <Feather name="edit-3" size={normalize(12)} color={COLORS.primary} />
          <Text style={styles.noteText}>Add Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    backgroundColor: COLORS.surface,
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: normalize(16),
  },
  exerciseImageContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(8),
    backgroundColor: COLORS.surface,
    padding: normalize(5),
    marginRight: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(4),
  },
  exerciseInfoContainer: {
    flex: 1,
    marginRight: normalize(12),
  },
  exerciseName: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontSize: normalize(16),
    marginBottom: normalize(4),
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  exerciseMuscleGroup: {
    fontSize: normalize(13),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: normalize(8),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(16),
    gap: normalize(12),
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    fontSize: normalize(16),
    color: COLORS.textPrimary,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: COLORS.textTertiary,
    marginTop: normalize(8),
  },
  noteContainer: {
    overflow: 'hidden',
    marginBottom: normalize(12),
  },
  notesInput: {
    minHeight: normalize(60),
    backgroundColor: COLORS.bg,
    borderRadius: normalize(10),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    fontSize: normalize(16),
    color: COLORS.textPrimary,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: normalize(16),
    gap: normalize(12),
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  replaceText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: normalize(6),
  },
  noteText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: normalize(6),
  },
});

export default ExerciseListItem;