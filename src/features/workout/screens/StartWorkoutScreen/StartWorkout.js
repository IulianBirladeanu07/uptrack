import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, AppState, BackHandler, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedMessage from '../../../../shared/components/AnimatedMessage/AnimatedMessage';
import ExerciseInput from '../../components/ExerciseInput/ExerciseInput';
import { sendWorkoutDataToFirestore, getSetsFromLastWorkout } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutService } from '../../services/WorkoutService';
import styles from './StartWorkoutStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import CustomNumericKeyboard from '../../components/CustomNumericKeyboard/CustomNumericKeyboard';

const TimerComponent = forwardRef(({ timerRingRotation }, ref) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const startTime = useRef(Date.now());
    const timerInterval = useRef(null);

    const formatTime = useCallback(timeInSeconds => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    }, []);

    useImperativeHandle(ref, () => ({
        getTotalTime: () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime.current) / 1000);
            return elapsed;
        },
        stopTimer: () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
        },
        resetTimer: () => {
            startTime.current = Date.now();
            setElapsedTime(0);
        },
    }));

    useEffect(() => {
        startTime.current = Date.now();
        setElapsedTime(0);
        
        const updateTime = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime.current) / 1000);
            setElapsedTime(elapsed);
        };

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                if (timerInterval.current) {
                    clearInterval(timerInterval.current);
                    timerInterval.current = null;
                }
            } else if (nextAppState === 'active') {
                updateTime();
                timerInterval.current = setInterval(updateTime, 1000);
            }
        });

        timerInterval.current = setInterval(updateTime, 1000);
        updateTime();

        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
            subscription.remove();
        };
    }, []);

    return (
        <View style={styles.timerContainer}>
            <Animated.View
                style={[
                    styles.timerProgress,
                    {
                        transform: [{
                            rotate: timerRingRotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg'],
                            }),
                        }],
                    },
                ]}
            />
            <View style={styles.timerInner}>
                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>
        </View>
    );
});

const StartWorkout = ({ route, navigation }) => {
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [exerciseData, setExerciseData] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isValidationPressed, setIsValidationPressed] = useState(false);
    const [animatedMessage, setAnimatedMessage] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInputData, setFocusedInputData] = useState(null);
    const [isCommandCenterVisible, setIsCommandCenterVisible] = useState(false);
    
    const timerRef = useRef(null);
    const flatListRef = useRef(null);
    const { refreshAllData } = useContext(WorkoutContext);
    const insets = useSafeAreaInsets();
    const isFinishingWorkout = useRef(false);
    const isInitialized = useRef(false);
    
    const timerRingRotation = useRef(new Animated.Value(0)).current;
    const addButtonScale = useRef(new Animated.Value(1)).current;
    
    const timerAnimationRef = useRef(null);
    const buttonAnimationRef = useRef(null);

    const startTimerAnimation = useCallback(() => {
        if (timerAnimationRef.current) timerAnimationRef.current.stop();
        timerAnimationRef.current = Animated.loop(
            Animated.timing(timerRingRotation, { toValue: 1, duration: 3000, useNativeDriver: true })
        );
        timerAnimationRef.current.start();
    }, [timerRingRotation]);

    const startAddButtonAnimation = useCallback(() => {
        if (buttonAnimationRef.current) buttonAnimationRef.current.stop();
        buttonAnimationRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(addButtonScale, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
                Animated.timing(addButtonScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        buttonAnimationRef.current.start();
    }, [addButtonScale]);

    useEffect(() => {
        if (isKeyboardVisible) {
            if (timerAnimationRef.current) timerAnimationRef.current.stop();
            if (buttonAnimationRef.current) buttonAnimationRef.current.stop();
            setIsCommandCenterVisible(false);
        } else {
            startTimerAnimation();
            startAddButtonAnimation();
            if (exerciseData.length > 0) {
                setIsCommandCenterVisible(true);
            }
        }
    }, [isKeyboardVisible, exerciseData.length, startTimerAnimation, startAddButtonAnimation]);

    const openAnimatedMessage = useCallback(
        message => {
            setAnimatedMessage(message);
            setTimeout(() => setAnimatedMessage(''), 2000);
        },
        []
    );

    const handleKeyboardChange = useCallback((isVisible, inputData) => {
        if (isVisible && inputData) {
            setFocusedInputData(inputData);
            setIsKeyboardVisible(true);
        } else {
            setFocusedInputData(null);
            setIsKeyboardVisible(false);
        }
    }, []);

    const handleNext = useCallback(() => {
        if (!focusedInputData) return;
        
        const { type, exerciseIndex, index: setIndex } = focusedInputData;
        let nextFocus = null;
        let shouldScrollToExercise = false;
        
        if (type === 'weight') {
            nextFocus = { type: 'reps', exerciseIndex, index: setIndex };
        } else if (type === 'reps') {
            const nextSetIndex = setIndex + 1;
            if (nextSetIndex < (exerciseData[exerciseIndex]?.sets.length || 0)) {
                nextFocus = { type: 'weight', exerciseIndex, index: nextSetIndex };
            } else {
                const nextExerciseIndex = exerciseIndex + 1;
                if (nextExerciseIndex < exerciseData.length) {
                    nextFocus = { type: 'weight', exerciseIndex: nextExerciseIndex, index: 0 };
                    shouldScrollToExercise = true;
                } else {
                    setIsKeyboardVisible(false);
                    setFocusedInputData(null);
                    return;
                }
            }
        }
        
        if (nextFocus) {
            setFocusedInputData(nextFocus);
            
            if (shouldScrollToExercise) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: nextFocus.exerciseIndex,
                        animated: true,
                        viewPosition: 0.2, 
                    });
                }, 100);
            }
        }
    }, [focusedInputData, exerciseData]);

    const addNewExercisesFromRoute = useCallback(
        (exercises) => {
            if (!exercises || !Array.isArray(exercises)) {
                console.log('No exercises to add');
                return;
            }
            
            console.log('Adding exercises from route:', exercises);
            
            const currentData = workoutService.getExerciseData();
            console.log('Current exercise data:', currentData);
            
            const newExercises = exercises
                .filter(ex => ex && ex.name && !currentData.some(existing => existing.exerciseName === ex.name))
                .map((ex) => ({
                    exerciseName: ex.name,
                    imageURL: ex.imageURL || '',
                    sets: [{ weight: '', reps: '', isValidated: false, repsModified: false }],
                    lastWorkoutSets: [],
                    repRange: ex.repRange || '',
                }));

            console.log('New exercises to add:', newExercises);

            if (newExercises.length > 0) {
                workoutService.addExercises(newExercises);
                console.log('Exercises added to workoutService');
                
                const updatedData = workoutService.getExerciseData();
                console.log('Updated data after adding:', updatedData);
                setExerciseData(updatedData);
                
                if (!selectedExercise) {
                    setSelectedExercise(newExercises[0]?.exerciseName || null);
                }

                setTimeout(() => {
                    exercises.forEach(async (exercise, index) => {
                        try {
                            const lastSets = await getSetsFromLastWorkout(exercise.name);
                            if (lastSets && lastSets.length > 0) {
                                const currentExercises = workoutService.getExerciseData();
                                const exerciseToUpdate = currentExercises.find(ex => ex.exerciseName === exercise.name);
                                if (exerciseToUpdate) {
                                    exerciseToUpdate.lastWorkoutSets = lastSets;
                                    workoutService.notifySubscribers?.();
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching last workout for ${exercise.name}:`, error);
                        }
                    });
                }, 100);
            } else {
                console.log('No new exercises to add (might be duplicates)');
            }
        },
        [selectedExercise]
    );

    const handleSelectedWorkout = useCallback(
        async ({ note, exercises }) => {
            if (!exercises || !Array.isArray(exercises)) return;
            
            setInputText(note || '');
            
            const exercisesWithSets = exercises
                .filter(ex => ex && ex.exerciseName)
                .map((ex) => {
                    const numSets = parseInt(ex.numSets) || 1;
                    const repRangeMatch = ex.repRange ? ex.repRange.match(/(\d+)-(\d+)/) : null;
                    let defaultReps;
                    if (repRangeMatch) {
                        const minReps = parseInt(repRangeMatch[1]);
                        const maxReps = parseInt(repRangeMatch[2]);
                        defaultReps = Array.from({length: numSets}, (_, i) => i === 0 ? maxReps.toString() : minReps.toString());
                    } else {
                        defaultReps = Array(numSets).fill('');
                    }
                    const sets = Array.from({length: numSets}, (_, i) => ({
                        weight: '',
                        reps: defaultReps[i] || '',
                        isValidated: false,
                        repsModified: false
                    }));
                    return {
                        ...ex,
                        lastWorkoutSets: [],
                        sets,
                        repRange: ex.repRange || '',
                    };
                });

            workoutService.resetAndLoad(exercisesWithSets);
            setSelectedExercise(exercisesWithSets[0]?.exerciseName || null);
            setIsValidationPressed(false);

            setTimeout(async () => {
                try {
                    const setsPromises = exercises.map(ex => 
                        ex?.exerciseName ? getSetsFromLastWorkout(ex.exerciseName) : Promise.resolve([])
                    );
                    const lastWorkoutSetsResults = await Promise.all(setsPromises);
                    
                    const currentExercises = workoutService.getExerciseData();
                    exercisesWithSets.forEach((ex, index) => {
                        const exerciseToUpdate = currentExercises.find(curr => curr.exerciseName === ex.exerciseName);
                        if (exerciseToUpdate && lastWorkoutSetsResults[index] && lastWorkoutSetsResults[index].length > 0) {
                            exerciseToUpdate.lastWorkoutSets = lastWorkoutSetsResults[index];
                        }
                    });
                    
                    workoutService.notifySubscribers?.();
                } catch (error) {
                    console.error('Error fetching last workout sets:', error.message);
                }
            }, 100);
        },
        []
    );

    useEffect(() => {
        console.log('StartWorkout mounted, initializing...');
        
        const hasTemplate = route.params?.selectedWorkout;
        
        const unsubscribe = workoutService.subscribe((newData) => {
            console.log('WorkoutService data updated:', newData);
            if (!isFinishingWorkout.current) {
                setExerciseData(newData);
                const allValidated = workoutService.areAllSetsValidated();
                setIsValidationPressed(allValidated);
            }
        });

        if (hasTemplate) {
            if (timerRef.current?.resetTimer) {
                timerRef.current.resetTimer();
            }
            handleSelectedWorkout(route.params.selectedWorkout);
        } else {
            workoutService.reset();
            const initialData = workoutService.getExerciseData();
            setExerciseData(initialData);
        }

        isInitialized.current = true;

        return () => {
            console.log('Cleaning up subscription');
            unsubscribe();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            console.log('Screen focused, checking for new exercises');
            
            if (isInitialized.current && route.params?.selectedExercises) {
                console.log('Found selectedExercises in params:', route.params.selectedExercises);
                addNewExercisesFromRoute(route.params.selectedExercises);
                navigation.setParams({ selectedExercises: undefined });
            }

            if (isInitialized.current && route.params?.selectedExercise) {
                console.log('Found selectedExercise in params:', route.params.selectedExercise);
                setSelectedExercise(route.params.selectedExercise);
                navigation.setParams({ selectedExercise: undefined });
            }
        }, [route.params?.selectedExercises, route.params?.selectedExercise, addNewExercisesFromRoute, navigation])
    );

    const handleExit = useCallback(() => {
        Alert.alert("Exit Workout", "Are you sure you want to exit the workout?", [
            { text: "Cancel", style: "cancel" },
            { text: "YES", onPress: confirmExit },
        ]);
    }, []);

    const confirmExit = useCallback(() => {
        timerRef.current?.stopTimer();
        workoutService.reset();
        navigation.goBack();
    }, [navigation]);

    const handleFinishWorkout = useCallback(async () => {
        if (exerciseData.length === 0) {
            openAnimatedMessage('Add exercises to finish workout');
            return;
        }
        
        try {
            isFinishingWorkout.current = true;
            
            const totalTime = timerRef.current && typeof timerRef.current.getTotalTime === 'function' 
                ? timerRef.current.getTotalTime() 
                : 0;
            timerRef.current?.stopTimer();
            
            const allValidated = workoutService.areAllSetsValidated();
            const workoutData = [...exerciseData];
            const workoutNote = inputText;
            
            await sendWorkoutDataToFirestore(
                workoutData,
                workoutNote,
                allValidated,
                navigation,
                openAnimatedMessage,
                (time) => {
                    const minutes = Math.floor(time / 60);
                    const seconds = time % 60;
                    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                },
                totalTime
            );
            
            workoutService.reset();
            refreshAllData();
            isFinishingWorkout.current = false;
        } catch (error) {
            console.error('Error finishing workout:', error.message);
            Alert.alert('Error', 'An error occurred while finishing the workout.', [{ text: "OK" }]);
            isFinishingWorkout.current = false;
        }
    }, [exerciseData, inputText, navigation, openAnimatedMessage, refreshAllData]);

    const handleAddExercisePress = useCallback(() => {
        if (!navigation) {
            Alert.alert('Error', 'Navigation is not available.', [{ text: 'OK' }]);
            return;
        }
        navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
    }, [navigation]);

    const handleScroll = useCallback((event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - normalize(100); 
        setIsCommandCenterVisible(Boolean(isAtBottom && !isKeyboardVisible && exerciseData.length > 0));
    }, [exerciseData.length, isKeyboardVisible]);

    const renderEmptyState = useMemo(() => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
                <Animated.View
                    style={[
                        styles.emptyStateIconContainer,
                        { transform: [{ scale: addButtonScale }] },
                    ]}
                >
                    <Ionicons name="fitness-outline" size={normalize(60)} color={styles.emptyStateIconContainer.borderColor} />
                </Animated.View>
                <Text style={styles.emptyStateTitle}>Ready to Start?</Text>
                <Text style={styles.emptyStateSubtitle}>
                    Add your first exercise to begin your workout session
                </Text>
                <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={handleAddExercisePress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                >
                    <View style={styles.addExerciseButtonContent}>
                        <Ionicons name="add" size={normalize(20)} color={styles.addExerciseButtonText.color} />
                        <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.emptyStateHint}>
                    Tap to browse exercises by muscle group
                </Text>
            </View>
        </View>
    ), [addButtonScale, handleAddExercisePress]);

    const renderItem = useCallback(
        ({ item: exercise, index: exerciseIndex }) => {
            if (!exercise || !exercise.exerciseName) return null;
            return (
                <ExerciseInput
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    exerciseData={exerciseData}
                    openAnimatedMessage={openAnimatedMessage}
                    onKeyboardChange={handleKeyboardChange}
                    focusedInputData={focusedInputData}
                />
            );
        },
        [exerciseData, openAnimatedMessage, handleKeyboardChange, focusedInputData]
    );

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        startTimerAnimation();
        startAddButtonAnimation();

        return () => {
            backHandler.remove();
            if (timerAnimationRef.current) timerAnimationRef.current.stop();
            if (buttonAnimationRef.current) buttonAnimationRef.current.stop();
            timerRef.current?.stopTimer();
        };
    }, [startTimerAnimation, startAddButtonAnimation]);

    const handleBackPress = useCallback(() => {
        Alert.alert("Hold on!", "Are you sure you want to go back?", [
            { text: "Cancel", style: "cancel" },
            { text: "YES", onPress: () => navigation.goBack() },
        ]);
        return true;
    }, [navigation]);

    const filteredExerciseData = useMemo(() => 
        exerciseData.filter(ex => ex && ex.exerciseName && Array.isArray(ex.sets)),
        [exerciseData]
    );

    const handleDismissKeyboard = useCallback(() => {
        setIsKeyboardVisible(false);
        setFocusedInputData(null);
    }, []);

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + normalize(20) }]}>
                <TouchableOpacity style={styles.headerButton} onPress={handleExit} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TimerComponent ref={timerRef} timerRingRotation={timerRingRotation} />
                <TouchableOpacity
                    style={[styles.headerButton, styles.finishButton]}
                    onPress={handleFinishWorkout}
                    disabled={exerciseData.length === 0}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Text style={[styles.finishText, exerciseData.length === 0 && styles.finishTextDisabled]}>Finish</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollViewContent,
                    filteredExerciseData.length === 0 && styles.scrollViewContentEmpty,
                    { paddingBottom: isKeyboardVisible ? normalize(350) + insets.bottom : normalize(140) + insets.bottom },
                ]}
                data={filteredExerciseData}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.exerciseName}-${index}`}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
                onScroll={handleScroll}
                scrollEventThrottle={100}
                ListEmptyComponent={renderEmptyState}
                keyboardShouldPersistTaps="always"
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 100));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true,
                            viewPosition: 0.2,
                        });
                    });
                }}
            />

            {isCommandCenterVisible === true && filteredExerciseData.length > 0 ? (
                <View style={[styles.commandCenter, { bottom: normalize(32) + insets.bottom }]}>
                    <TouchableOpacity
                        style={styles.commandAdd}
                        onPress={handleAddExercisePress}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Text style={styles.commandButtonText}>+ Add Exercise</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {animatedMessage ? <AnimatedMessage message={animatedMessage} /> : null}

            {isKeyboardVisible && focusedInputData ? (
                <View style={styles.customKeyboardContainer}>
                    <CustomNumericKeyboard
                        value={
                            focusedInputData.type === 'weight'
                                ? exerciseData[focusedInputData.exerciseIndex]?.sets[focusedInputData.index]?.weight || ''
                                : exerciseData[focusedInputData.exerciseIndex]?.sets[focusedInputData.index]?.reps || ''
                        }
                        focusedInputData={focusedInputData}
                        onChangeText={(text) => {
                            if (focusedInputData.type === 'weight') {
                                workoutService.updateWeight(focusedInputData.exerciseIndex, focusedInputData.index, text);
                            } else {
                                workoutService.updateReps(focusedInputData.exerciseIndex, focusedInputData.index, text);
                            }
                        }}
                        onNext={handleNext}
                        onDone={handleDismissKeyboard}
                    />
                </View>
            ) : null}
        </View>
    );
};

export default React.memo(StartWorkout);