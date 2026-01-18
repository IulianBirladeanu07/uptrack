import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, Animated, Alert, TouchableOpacity } from 'react-native';
import { workoutService } from '../../services/WorkoutService';
import ExerciseHeader from './ExerciseHeader';
import SetRow from './SetRow';
import { COLORS, styles } from './ExerciseInputStyles';
import { Keyboard } from 'react-native';

const ExerciseInput = ({
  exercise,
  exerciseIndex,
  exerciseData,
  openAnimatedMessage,
  onKeyboardChange,
  focusedInputData,
  navigation,
}) => {
  if (!exerciseData || !Array.isArray(exerciseData) || !exerciseData[exerciseIndex]) {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.errorText}>Error: Invalid exercise data</Text>
      </View>
    );
  }

  const currentSets = useMemo(() => exerciseData[exerciseIndex].sets || [], [exerciseData, exerciseIndex]);
  const animRefs = useRef({
    fade: [],
    cardEntry: new Animated.Value(0),
    completionOpacity: new Animated.Value(0),
  }).current;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const inputRefs = useRef({});

  const menuOptions = useMemo(() => [
    { value: 'replace', label: 'Replace Exercise' },
    { value: 'delete', label: 'Delete Exercise' },
    { value: 'history', label: 'Exercise History' }
  ], []);

  const allSetsCompleted = useMemo(() => {
    return currentSets.length > 0 && currentSets.every(set => set.isValidated);
  }, [currentSets]);

  const prevCompletedRef = useRef(allSetsCompleted);

  const handleAddSetPress = useCallback(() => {
    workoutService.addSet(exerciseIndex);
  }, [exerciseIndex]);

  useEffect(() => {
    const newLength = currentSets.length;
    const oldLength = animRefs.fade.length;
    if (newLength > oldLength) {
      for (let i = oldLength; i < newLength; i++) {
        animRefs.fade[i] = new Animated.Value(0);
      }
      const newAnims = animRefs.fade.slice(oldLength);
      Animated.stagger(50, newAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      )).start();
    }
  }, [currentSets.length]);

  useEffect(() => {
    Animated.timing(animRefs.cardEntry, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (allSetsCompleted === prevCompletedRef.current) return;
    
    prevCompletedRef.current = allSetsCompleted;
    
    Animated.timing(animRefs.completionOpacity, {
      toValue: allSetsCompleted ? 1 : 0,
      duration: allSetsCompleted ? 250 : 150,
      useNativeDriver: false,
    }).start();
  }, [allSetsCompleted]);

  const handleMenuOption = useCallback((option) => {
    setIsMenuVisible(false);
    switch (option) {
      case 'replace':
        openAnimatedMessage('Replace Exercise clicked');
        break;
      case 'delete':
        Alert.alert(
          "Delete Exercise",
          "Are you sure you want to delete this exercise?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              onPress: () => {
                workoutService.deleteExercise(exerciseIndex);
              },
              style: "destructive" 
            }
          ]
        );
        break;
      case 'history':
        openAnimatedMessage('Exercise History clicked');
        break;
    }
  }, [exerciseIndex, openAnimatedMessage]);

  const handlePreviousSetPress = useCallback((setIndex) => {
    const previousSet = exercise.lastWorkoutSets?.[setIndex];
    if (previousSet) {
      workoutService.updateWeight(exerciseIndex, setIndex, previousSet.weight?.toString() || '');
      workoutService.updateReps(exerciseIndex, setIndex, previousSet.reps?.toString() || '');
    } else {
      openAnimatedMessage('No previous set data available');
    }
  }, [exercise.lastWorkoutSets, exerciseIndex, openAnimatedMessage]);

  const closeMenu = useCallback(() => {
    if (isMenuVisible) {
      setIsMenuVisible(false);
    }
  }, [isMenuVisible]);

  const completedGridColor = useMemo(() => 'rgba(0, 212, 255, 0.03)', []);

  const gridStyles = useMemo(() => {
    if (!allSetsCompleted) return styles.dataGrid;
    
    return [
      styles.dataGrid,
      {
        backgroundColor: animRefs.completionOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [COLORS.surfaceLight, completedGridColor]
        })
      }
    ];
  }, [allSetsCompleted, completedGridColor]);

  const setRows = useMemo(() => currentSets.map((data, setIndex) => (
    <SetRow
      key={`set-${exerciseIndex}-${setIndex}`}
      setData={data}
      setIndex={setIndex}
      exerciseIndex={exerciseIndex}
      previousSetData={exercise.lastWorkoutSets?.[setIndex]}
      handlePreviousSetPress={handlePreviousSetPress}
      totalSetsInExercise={currentSets.length}
      fadeAnim={animRefs.fade}
      inputRefs={inputRefs}
      exercise={exercise}
      onKeyboardChange={onKeyboardChange}
      focusedInputData={focusedInputData}
      openAnimatedMessage={openAnimatedMessage}
    />
  )), [
    currentSets,
    exercise.lastWorkoutSets,
    exerciseIndex,
    animRefs.fade,
    exercise,
    handlePreviousSetPress,
    onKeyboardChange,
    focusedInputData,
  ]);

  return (
    <TouchableWithoutFeedback onPress={() => {
      closeMenu();
      Keyboard.dismiss(); 
    }}>
      <Animated.View style={[
        styles.exerciseCard, 
        {
          opacity: animRefs.cardEntry,
          transform: [{
            translateY: animRefs.cardEntry.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            })
          }]
        }
      ]}>
        <ExerciseHeader
          exercise={exercise}
          isMenuVisible={isMenuVisible}
          setIsMenuVisible={setIsMenuVisible}
          menuOptions={menuOptions}
          handleMenuOption={handleMenuOption}
          navigation={navigation}
        />
        <Animated.View style={gridStyles}>
          <View style={styles.gridHeader}>
            <View style={styles.gridHeaderSet}>
              <Text style={styles.gridHeaderText}>SET</Text>
            </View>
            <View style={styles.gridHeaderPrev}>
              <Text style={styles.gridHeaderText}>PREVIOUS</Text>
            </View>
            <View style={styles.gridHeaderWeight}>
              <Text style={styles.gridHeaderText}>WEIGHT</Text>
            </View>
            <View style={styles.gridHeaderReps}>
              <Text style={styles.gridHeaderText}>REPS</Text>
            </View>
            <View style={styles.gridHeaderStatus}>
              <Text style={styles.gridHeaderText}></Text>
            </View>
          </View>
          {setRows}
          <TouchableOpacity
            style={styles.holoAddBtn}
            onPress={handleAddSetPress}
            activeOpacity={0.8}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.holoAddBtnText}>+ Add Set</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ExerciseInput;