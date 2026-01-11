import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, BackHandler, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedMessage from '../../../../shared/components/AnimatedMessage/AnimatedMessage';
import ExerciseInput from '../../components/ExerciseInput/ExerciseInput';
import { sendWorkoutDataToFirestore, getSetsFromLastWorkout } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutService } from '../../services/WorkoutService';
import { workoutNotifications } from '../../services/WorkoutNotificationService';
import { workoutTimer, useWorkoutTimer } from '../../services/WorkoutTimerService';
import styles from './StartWorkoutStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import CustomNumericKeyboard from '../../components/CustomNumericKeyboard/CustomNumericKeyboard';

const TimerComponent = () => {
    const { formattedTime } = useWorkoutTimer();
    
    return (
        <View style={styles.timerContainer}>
            <View style={styles.timerInner}>
                <Text style={styles.timerText}>{formattedTime}</Text>
            </View>
        </View>
    );
};

const StartWorkout = ({ route, navigation }) => {
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [exerciseData, setExerciseData] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isValidationPressed, setIsValidationPressed] = useState(false);
    const [animatedMessage, setAnimatedMessage] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInputData, setFocusedInputData] = useState(null);
    const [isCommandCenterVisible, setIsCommandCenterVisible] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const flatListRef = useRef(null);
    const { refreshAllData } = useContext(WorkoutContext);
    const insets = useSafeAreaInsets();
    const isFinishingWorkout = useRef(false);
    const isInitialized = useRef(false);
    const backPressCount = useRef(0);
    const backPressTimer = useRef(null);

    const { formattedTime } = useWorkoutTimer();

    const updateNotification = useCallback(() => {
        if (exerciseData.length === 0) return;
        
        const current = exerciseData[0];
        const completedSets = current.sets.filter(s => s.isValidated).length;
        const currentSetNumber = completedSets + 1;
        const totalSets = current.sets.length;
        
        workoutNotifications.update(
            current.exerciseName,
            currentSetNumber,
            totalSets,
            formattedTime
        );
    }, [exerciseData, formattedTime]);

    useEffect(() => {
        updateNotification();
    }, [updateNotification]);

    const openAnimatedMessage = useCallback(
        message => {
            setAnimatedMessage(message);
            setTimeout(() => setAnimatedMessage(''), 2000);
        },
        []
    );

    const handleKeyboardChange = useCallback((isVisible, inputData) => {
        console.log('Keyboard change:', { isVisible, inputData });
        if (isVisible && inputData) {
            setFocusedInputData(inputData);
            setIsKeyboardVisible(true);
            
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: inputData.exerciseIndex,
                    animated: true,
                    viewPosition: 0.2,
                });
            }, 100);
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
            if (!exercises || !Array.isArray(exercises)) return;
            
            const currentData = workoutService.getExerciseData();
            
            const newExercises = exercises
                .filter(ex => ex && ex.name && !currentData.some(existing => existing.exerciseName === ex.name))
                .map((ex) => ({
                    exerciseName: ex.name,
                    imageURL: ex.imageURL || '',
                    sets: [{ weight: '', reps: '', isValidated: false, repsModified: false }],
                    lastWorkoutSets: [],
                    repRange: ex.repRange || '',
                }));

            if (newExercises.length > 0) {
                workoutService.addExercises(newExercises);
                const updatedData = workoutService.getExerciseData();
                setExerciseData(updatedData);
                
                if (!selectedExercise) {
                    setSelectedExercise(newExercises[0]?.exerciseName || null);
                }

                setTimeout(() => {
                    exercises.forEach(async (exercise) => {
                        try {
                            const lastSets = await getSetsFromLastWorkout(exercise.name);
                            if (lastSets && lastSets.length > 0) {
                                const currentExercises = workoutService.getExerciseData();
                                const exerciseToUpdate = currentExercises.find(ex => ex.exerciseName === exercise.name);
                                if (exerciseToUpdate) {
                                    exerciseToUpdate.lastWorkoutSets = lastSets;
                                    workoutService.notifyListeners?.();
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching last workout for ${exercise.name}:`, error);
                        }
                    });
                }, 100);
            }
        },
        [selectedExercise]
    );

const handleSelectedWorkout = useCallback(
    async ({ note, exercises }) => {
        if (!exercises || !Array.isArray(exercises)) return;
        
        setInputText(note || '');
        workoutService.setWorkoutNote(note || '');
        
        const exercisesWithSets = exercises
            .filter(ex => ex && ex.exerciseName)
            .map((ex) => {
                if (ex.sets && ex.sets.length > 0 && ex.sets[0].weight !== undefined) {
                    return {
                        ...ex,
                        lastWorkoutSets: ex.lastWorkoutSets || [],
                        sets: ex.sets.map(set => ({
                            weight: set.weight || '',
                            reps: set.reps || '',
                            isValidated: false,
                            repsModified: false
                        })),
                        repRange: ex.repRange || '',
                    };
                }
                
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
                    lastWorkoutSets: ex.lastWorkoutSets || [],
                    sets,
                    repRange: ex.repRange || '',
                };
            });

        const loadedData = workoutService.resetAndLoad(exercisesWithSets);
        setExerciseData(loadedData);
        workoutTimer.start();
        setSelectedExercise(exercisesWithSets[0]?.exerciseName || null);
        setIsValidationPressed(false);

        setTimeout(async () => {
            try {
                const exercisesNeedingLastWorkout = exercises.filter(ex => 
                    !ex.lastWorkoutSets || ex.lastWorkoutSets.length === 0
                );
                
                if (exercisesNeedingLastWorkout.length > 0) {
                    const setsPromises = exercisesNeedingLastWorkout.map(ex => 
                        ex?.exerciseName ? getSetsFromLastWorkout(ex.exerciseName) : Promise.resolve([])
                    );
                    const lastWorkoutSetsResults = await Promise.all(setsPromises);
                    
                    const currentExercises = workoutService.getExerciseData();
                    exercisesNeedingLastWorkout.forEach((ex, index) => {
                        const exerciseToUpdate = currentExercises.find(curr => curr.exerciseName === ex.exerciseName);
                        if (exerciseToUpdate && lastWorkoutSetsResults[index] && lastWorkoutSetsResults[index].length > 0) {
                            exerciseToUpdate.lastWorkoutSets = lastWorkoutSetsResults[index];
                        }
                    });
                    
                    workoutService.notifyListeners?.();
                }
            } catch (error) {
                console.error('Error fetching last workout sets:', error.message);
            }
        }, 100);
    },
    []
);
    useEffect(() => {
        const hasTemplate = route.params?.selectedWorkout;
        
        const unsubscribe = workoutService.subscribe((newData) => {
            if (!isFinishingWorkout.current) {
                setExerciseData(newData);
                const allValidated = workoutService.areAllSetsValidated();
                setIsValidationPressed(allValidated);
            }
        });

        const initWorkout = async () => {
            if (hasTemplate) {
                workoutTimer.start();
                await handleSelectedWorkout(route.params.selectedWorkout);
                refreshAllData();
            } else {
                const restored = await workoutService.restoreWorkout();
                if (restored) {
                    workoutTimer.restore(restored.startTime);
                    setExerciseData(workoutService.getExerciseData());
                    setInputText(workoutService.getWorkoutNote());
                    refreshAllData();
                } else {
                    workoutTimer.start();
                    workoutService.startWorkout();
                    const initialData = workoutService.getExerciseData();
                    setExerciseData(initialData);
                    refreshAllData();
                }
            }
            
            await workoutNotifications.init();
            setIsInitializing(false);
        };
        initWorkout();
        isInitialized.current = true;

        return () => {
            unsubscribe();
        };
    }, [handleSelectedWorkout]);

    useFocusEffect(
        useCallback(() => {
            if (isInitialized.current && route.params?.selectedExercises) {
                addNewExercisesFromRoute(route.params.selectedExercises);
                navigation.setParams({ selectedExercises: undefined });
            }

            if (isInitialized.current && route.params?.selectedExercise) {
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

    const confirmExit = useCallback(async () => {
        workoutTimer.stop();
        await workoutService.clearWorkout();
        await workoutNotifications.clear();
        refreshAllData();
        navigation.navigate('Workout');
    }, [navigation, refreshAllData]);

    const handleFinishWorkout = useCallback(async () => {
    if (exerciseData.length === 0) {
        openAnimatedMessage('Add exercises to finish workout');
        return;
    }
    
    try {
        isFinishingWorkout.current = true;
        
        const totalTime = workoutTimer.getElapsed();
        const allValidated = workoutService.areAllSetsValidated();
        const workoutData = [...exerciseData];
        const workoutNote = inputText;
        const templateName = route.params?.selectedWorkout?.templateName || '';
        
        await sendWorkoutDataToFirestore(
        workoutData,
        workoutNote,
        allValidated,
        navigation,
        openAnimatedMessage,
        () => workoutTimer.getFormattedTime(),
        totalTime,
        templateName
        );
        
        workoutTimer.stop();
        await workoutService.clearWorkout();
        await workoutNotifications.clear();
        refreshAllData();
        isFinishingWorkout.current = false;
    } catch (error) {
        console.error('Error finishing workout:', error.message);
        Alert.alert('Error', 'An error occurred while finishing the workout.', [{ text: "OK" }]);
        isFinishingWorkout.current = false;
    }
    }, [exerciseData, inputText, navigation, openAnimatedMessage, refreshAllData, route.params]);

    const handleAddExercisePress = useCallback(async () => {
        if (!navigation) {
            Alert.alert('Error', 'Navigation is not available.', [{ text: 'OK' }]);
            return;
        }
        
        workoutService.startWorkout();
        await workoutService.persistWorkout();
        navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
    }, [navigation]);

    const handleScroll = useCallback((event) => {
        if (isKeyboardVisible) {
            setIsCommandCenterVisible(false);
            return;
        }
        
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const canScroll = contentSize.height > layoutMeasurement.height;
        
        if (!canScroll) {
            setIsCommandCenterVisible(exerciseData.length > 0);
            return;
        }
        
        const paddingToBottom = normalize(50);
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
        setIsCommandCenterVisible(isAtBottom && exerciseData.length > 0);
    }, [exerciseData.length, isKeyboardVisible]);

    const renderEmptyState = useMemo(() => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIconContainer}>
                    <Ionicons name="fitness-outline" size={normalize(60)} color={styles.emptyStateIconContainer.borderColor} />
                </View>
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
    ), [handleAddExercisePress]);

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
        return () => {
            backHandler.remove();
        };
    }, []);

    useEffect(() => {
        if (isKeyboardVisible) {
            setIsCommandCenterVisible(false);
        } else if (exerciseData.length > 0) {
            setTimeout(() => setIsCommandCenterVisible(true), 100);
        }
    }, [isKeyboardVisible, exerciseData.length]);

    const handleBackPress = useCallback(() => {
        if (isKeyboardVisible) {
            setIsKeyboardVisible(false);
            setFocusedInputData(null);
            return true;
        }
        
        backPressCount.current += 1;
        
        if (backPressCount.current === 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            openAnimatedMessage('Press back again to minimize workout');
            
            backPressTimer.current = setTimeout(() => {
                backPressCount.current = 0;
            }, 2000);
            
            return true;
        }
        
        if (backPressCount.current === 2) {
            clearTimeout(backPressTimer.current);
            backPressCount.current = 0;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
            return true;
        }
        
        return true;
    }, [navigation, openAnimatedMessage, isKeyboardVisible]);

    const filteredExerciseData = useMemo(() => 
        exerciseData.filter(ex => ex && ex.exerciseName && Array.isArray(ex.sets)),
        [exerciseData]
    );

    const handleDismissKeyboard = useCallback(() => {
        setIsKeyboardVisible(false);
        setFocusedInputData(null);
    }, []);

    useEffect(() => {
        const syncInputText = () => {
            workoutService.setWorkoutNote(inputText);
        };
        
        const timeoutId = setTimeout(syncInputText, 500);
        return () => clearTimeout(timeoutId);
    }, [inputText]);

    if (isInitializing) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FF9500" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + normalize(20) }]}>
                <TouchableOpacity style={styles.headerButton} onPress={handleExit} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TimerComponent />
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