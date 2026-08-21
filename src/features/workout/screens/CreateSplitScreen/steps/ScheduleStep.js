import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import styles from './ScheduleStepStyles';
import { colors, spacing } from '../../../../../shared/theme';
import WorkoutPreviewCard from '../components/WorkoutPreviewCard';
import { daysOfWeek } from '../constants/CreateSplitScreenConstants';

const ScheduleStep = ({
  splitData,
  workouts,
  selectedDay,
  setSelectedDay,
  handleDayAssignment,
  handleAddRotationDay,
  handleRemoveRotationDay,
  handleRemoveWorkout,
  navigation,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rotationDaysInput, setRotationDaysInput] = useState('');

  const isWeeklySchedule = splitData.type === 'weekly';
  const isRotationSchedule = splitData.type === 'rotation';

  const rotationDays = useMemo(() => {
    if (!isRotationSchedule) return [];

    const schedule = splitData.schedule || {};
    const existingNumbers = Object.keys(schedule)
      .map(key => parseInt(key))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    const dayCount = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 5;

    return Array.from({ length: dayCount }, (_, i) => ({
      id: i + 1,
      name: `Day ${i + 1}`,
      shortLabel: (i + 1).toString(),
      number: i + 1
    }));
  }, [isRotationSchedule, splitData.schedule]);

  const currentScheduleDays = isWeeklySchedule ? daysOfWeek : rotationDays;
  const assignedCount = Object.values(splitData.schedule).filter(w => w !== null).length;

  const currentDayWorkout = useMemo(() =>
    splitData.schedule[selectedDay],
    [splitData.schedule, selectedDay]
  );

  const handleWorkoutRemoval = useCallback((dayId) => {
    if (handleRemoveWorkout) {
      handleRemoveWorkout(dayId);
    }
  }, [handleRemoveWorkout]);

  const handleOpenModal = useCallback(() => {
    if (!isRotationSchedule) return;
    setRotationDaysInput(rotationDays.length.toString());
    setIsModalVisible(true);
  }, [isRotationSchedule, rotationDays.length]);

  const updateRotationDays = useCallback((newDayCount) => {
    const currentDayCount = rotationDays.length;

    if (newDayCount === currentDayCount) {
      return;
    }

    if (newDayCount > currentDayCount) {
      for (let i = currentDayCount + 1; i <= newDayCount; i++) {
        if (handleAddRotationDay) {
          handleAddRotationDay(i);
        }
      }
    } else if (newDayCount < currentDayCount) {
      for (let i = currentDayCount; i > newDayCount; i--) {
        if (handleRemoveRotationDay) {
          handleRemoveRotationDay(i);
        }
      }
    }

    if (selectedDay > newDayCount) {
      setSelectedDay(1);
    }
  }, [handleAddRotationDay, handleRemoveRotationDay, rotationDays.length, selectedDay, setSelectedDay]);

  const handleSaveRotationDays = useCallback(() => {
    const newDayCount = parseInt(rotationDaysInput);

    if (isNaN(newDayCount) || newDayCount < 1 || newDayCount > 14) {
      Alert.alert('Invalid Input', 'Please enter a number between 1 and 14 days.');
      return;
    }

    if (newDayCount === rotationDays.length) {
      setIsModalVisible(false);
      return;
    }

    if (newDayCount < rotationDays.length) {
      const wouldLoseWorkouts = rotationDays
        .slice(newDayCount)
        .some(day => splitData.schedule[day.number]);

      if (wouldLoseWorkouts) {
        Alert.alert(
          'Warning',
          `Reducing to ${newDayCount} days will remove workouts assigned to days ${newDayCount + 1} and above. Continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              style: 'destructive',
              onPress: () => {
                updateRotationDays(newDayCount);
                setIsModalVisible(false);
              }
            }
          ]
        );
        return;
      }
    }

    updateRotationDays(newDayCount);
    setIsModalVisible(false);
  }, [rotationDaysInput, rotationDays, splitData.schedule, updateRotationDays]);

  const workoutStats = useMemo(() => {
    const assigned = workouts.filter(workout =>
      Object.values(splitData.schedule).some(w => w?.id === workout.id)
    ).length;
    const unassigned = workouts.length - assigned;
    const restDays = isWeeklySchedule ? 7 - assignedCount : 0;
    return { assigned, unassigned, total: workouts.length, restDays };
  }, [workouts, splitData.schedule, assignedCount, isWeeklySchedule]);

  const getCurrentDayName = () => {
    if (isWeeklySchedule) {
      const currentDay = currentScheduleDays.find(d => d.id === selectedDay);
      return currentDay?.name || 'Day';
    } else {
      return `Day ${selectedDay}`;
    }
  };

  React.useEffect(() => {
    if (isRotationSchedule && Object.keys(splitData.schedule).length === 0 && handleAddRotationDay) {
      for (let i = 1; i <= 5; i++) {
        handleAddRotationDay(i);
      }
      setSelectedDay(1);
    }
  }, [isRotationSchedule, splitData.schedule, handleAddRotationDay, setSelectedDay]);

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.topBar}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Assign Workouts</Text>
          </View>
          <TouchableOpacity
            style={styles.addWorkoutTextButton}
            onPress={() => navigation.navigate('CreateTemplate')}
            activeOpacity={0.7}
          >
            <Text style={styles.addWorkoutText}>+ Create template</Text>
          </TouchableOpacity>
        </View>

        {isWeeklySchedule ? (
          <View style={[styles.dayPillsScrollView, { marginHorizontal: spacing[5] }]}>
            <View style={styles.dayPills}>
              {currentScheduleDays.map(day => {
                const dayId = day.id;
                const isSelected = selectedDay === dayId;
                const hasWorkout = !!splitData.schedule[dayId];
                return (
                  <TouchableOpacity
                    key={dayId}
                    style={styles.dayColumn}
                    onPress={() => setSelectedDay(dayId)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayCircle,
                      hasWorkout && !isSelected && styles.dayCircleHasWorkout,
                      isSelected && styles.dayCircleSelected,
                    ]}>
                      <Text style={[
                        styles.dayCircleText,
                        hasWorkout && !isSelected && styles.dayCircleTextHasWorkout,
                        isSelected && styles.dayCircleTextSelected,
                      ]}>
                        {day.shortLabel}
                      </Text>
                    </View>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                      {day.name.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayPillsContainer}
            style={styles.dayPillsScrollView}
          >
            <View style={styles.dayPills}>
              {currentScheduleDays.map(day => {
                const dayId = day.number;
                const isSelected = selectedDay === dayId;
                const hasWorkout = !!splitData.schedule[dayId];
                return (
                  <TouchableOpacity
                    key={dayId}
                    style={styles.dayColumn}
                    onPress={() => setSelectedDay(dayId)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayCircle,
                      hasWorkout && !isSelected && styles.dayCircleHasWorkout,
                      isSelected && styles.dayCircleSelected,
                    ]}>
                      <Text style={[
                        styles.dayCircleText,
                        hasWorkout && !isSelected && styles.dayCircleTextHasWorkout,
                        isSelected && styles.dayCircleTextSelected,
                      ]}>
                        {day.shortLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleOpenModal}
                activeOpacity={0.7}
                accessibilityLabel="Configure number of rotation days"
              >
                <Ionicons name="settings-outline" size={spacing.iconSm} color={colors.accent.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        <View style={styles.contextBar}>
          <View style={styles.contextLeft}>
            <Text style={styles.contextText}>
              {currentDayWorkout
                ? `${getCurrentDayName()}: ${currentDayWorkout.templateName}`
                : `${getCurrentDayName()} • Rest Day`
              }
            </Text>
            <Text style={styles.contextSubtext}>
              {currentDayWorkout
                ? `${currentDayWorkout.exercises?.length || 0} exercise${currentDayWorkout.exercises?.length === 1 ? '' : 's'} scheduled`
                : 'Select a workout below to schedule for this day'
              }
            </Text>
          </View>
          <View style={styles.contextRight}>
            {workoutStats.unassigned > 0 && (
              <Text style={styles.availableCount}>
                {workoutStats.unassigned} available
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.workoutsList}>
          {workouts.length > 0 ? (
            workouts.map((workout) => (
              <WorkoutPreviewCard
                key={workout.id}
                workout={workout}
                onSelect={workout => handleDayAssignment(workout, selectedDay)}
                onRemove={handleWorkoutRemoval}
                selectedDay={selectedDay}
                splitData={splitData}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="barbell-outline" size={spacing[12]} color={colors.text.quaternary} />
              </View>
              <Text style={styles.emptyStateTitle}>No workouts yet</Text>
              <Text style={styles.emptyStateText}>Create your first workout to start building your split</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('CreateTemplate')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={spacing.iconMd} color={colors.accent.cyan} />
                <Text style={styles.emptyStateButtonText}>Create Template</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Rotation</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={spacing.iconLg} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Number of days in rotation:</Text>
              <TextInput
                style={styles.modalInput}
                value={rotationDaysInput}
                onChangeText={setRotationDaysInput}
                keyboardType="numeric"
                placeholder="Enter number of days (1-14)"
                placeholderTextColor={colors.text.quaternary}
                maxLength={2}
                selectTextOnFocus={true}
              />
              <Text style={styles.modalHint}>
                Current: {rotationDays.length} days • Range: 1-14 days
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setIsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleSaveRotationDays}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default React.memo(ScheduleStep);