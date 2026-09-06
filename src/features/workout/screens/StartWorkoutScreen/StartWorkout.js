import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, BackHandler, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedMessage from '../../../../shared/components/AnimatedMessage/AnimatedMessage';
import ExerciseInput from '../../components/ExerciseInput/ExerciseInput';
import ExerciseOptionsModal from '../../components/ExerciseOptionsModal/ExerciseOptionsModal';
import { sendWorkoutDataToFirestore } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutService, createEmptySet } from '../../services/WorkoutService';
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
            <Ionicons name="time-outline" size={normalize(14)} color="#6B7280" style={{ marginRight: normalize(6) }} />
            <Text style={styles.timerText}>{formattedTime}</Text>
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
    const [activeExerciseMenu, setActiveExerciseMenu] = useState(null);

    const flatListRef = useRef(null);
    const { refreshAllData } = useContext(WorkoutContext);
    const insets = useSafeAreaInsets();
    const isFinishingWorkout = useRef(false);
    const isInitialized = useRef(false);
    const isKeyboardVisibleRef = useRef(false);
    const pendingReplaceRef = useRef(null);

    const updateNotification = useCallback(() => {
        if (exerciseData.length === 0) return;
        const current = exerciseData[0];
        const completedSets = current.sets.filter(s => s.isValidated).length;
        workoutNotifications.update(
            current.exerciseName,
            completedSets + 1,
            current.sets.length,
            workoutTimer.getFormattedTime()
        );
    }, [exerciseData]);

    useEffect(() => {
        updateNotification();
    }, [updateNotification]);

    const openAnimatedMessage = useCallback((message) => {
        setAnimatedMessage(message);
        setTimeout(() => setAnimatedMessage(''), 2000);
    }, []);

    const handleMenuPress = useCallback((exercise, exerciseIndex) => {
        if (isKeyboardVisibleRef.current) {
            setIsKeyboardVisible(false);
            setFocusedInputData(null);
            isKeyboardVisibleRef.current = false;
        }
        setActiveExerciseMenu({ exercise, exerciseIndex });
    }, []);

    const handleMenuClose = useCallback(() => {
        setActiveExerciseMenu(null);
    }, []);

    const handleMenuReplace = useCallback(() => {
        if (!activeExerciseMenu) return;
        pendingReplaceRef.current = activeExerciseMenu.exercise.exerciseName;
        navigation.navigate('ExerciseSelection', {
            previousScreen: 'StartWorkout',
            replaceExerciseName: activeExerciseMenu.exercise.exerciseName,
        });
    }, [activeExerciseMenu, navigation]);

    const handleMenuDelete = useCallback(() => {
        if (!activeExerciseMenu) return;
        workoutService.deleteExercise(activeExerciseMenu.exerciseIndex);
    }, [activeExerciseMenu]);

    const handleMenuMoveUp = useCallback(() => {
        if (!activeExerciseMenu) return;
        workoutService.moveExercise(activeExerciseMenu.exerciseIndex, -1);
    }, [activeExerciseMenu]);

    const handleMenuMoveDown = useCallback(() => {
        if (!activeExerciseMenu) return;
        workoutService.moveExercise(activeExerciseMenu.exerciseIndex, 1);
    }, [activeExerciseMenu]);

    const canMoveActiveExerciseUp = !!activeExerciseMenu && activeExerciseMenu.exerciseIndex > 0;
    const canMoveActiveExerciseDown = !!activeExerciseMenu && activeExerciseMenu.exerciseIndex < exerciseData.length - 1;

    const noteRegistryRef = useRef({});

    const onAddNote = useMemo(() => ({
        register: (exerciseIndex, fn) => {
            noteRegistryRef.current[exerciseIndex] = fn;
        },
    }), []);

    const handleMenuAddNote = useCallback(() => {
        if (!activeExerciseMenu) return;
        const trigger = noteRegistryRef.current[activeExerciseMenu.exerciseIndex];
        if (trigger) trigger();
    }, [activeExerciseMenu]);

    const handleKeyboardChange = useCallback((isVisible, inputData) => {
        isKeyboardVisibleRef.current = isVisible;
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
                    isKeyboardVisibleRef.current = false;
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

    const handleSelectedWorkout = useCallback(async ({ note, exercises, templateName }) => {
        if (!exercises || !Array.isArray(exercises)) return;
        workoutService.startWorkout();
        workoutService.setWorkoutTemplateName(templateName || '');
        setInputText(note || '');
        workoutService.setWorkoutNote(note || '');
        const loadedData = await workoutService.loadWorkoutFromTemplate(exercises);
        setExerciseData(loadedData);
        workoutTimer.start();
        setSelectedExercise(loadedData[0]?.exerciseName || null);
        setIsValidationPressed(false);
    }, []);

    const addNewExercisesFromRoute = useCallback(async (exercises) => {
        if (!exercises || !Array.isArray(exercises)) return;
        const currentData = workoutService.getExerciseData();
        const newExercises = [];

        for (const ex of exercises.filter(e => e && e.name)) {
            if (currentData.some(existing => existing.exerciseName === ex.name)) continue;
            const lastSets = await workoutService.fetchLastSets(ex.name);
            newExercises.push({
                exerciseName: ex.name,
                imageURL: ex.imageURL || '',
                sets: [createEmptySet()],
                lastWorkoutSets: lastSets,
                repRange: ex.repRange || '',
            });
        }

        if (newExercises.length > 0) {
            workoutService.addExercises(newExercises);
            const updatedData = workoutService.getExerciseData();
            setExerciseData(updatedData);
            if (!selectedExercise) {
                setSelectedExercise(newExercises[0]?.exerciseName || null);
            }
        }
    }, [selectedExercise]);

    const replaceExerciseFromRoute = useCallback(async (targetName, selected) => {
        const incoming = Array.isArray(selected) ? selected[0] : selected;
        const newName = incoming?.exerciseName || incoming?.name;
        if (!newName) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }

        const currentData = workoutService.getExerciseData();
        const targetIndex = currentData.findIndex(ex => ex.exerciseName === targetName);
        if (targetIndex === -1) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }

        const isDuplicate = currentData.some((ex, idx) => idx !== targetIndex && ex.exerciseName === newName);
        if (isDuplicate) {
            openAnimatedMessage('This exercise is already added.');
            return;
        }

        const lastSets = await workoutService.fetchLastSets(newName);
        const newExercise = {
            exerciseName: newName,
            imageURL: incoming.imageURL || '',
            sets: [createEmptySet()],
            lastWorkoutSets: lastSets,
            repRange: incoming.repRange || '',
        };

        workoutService.replaceExercise(targetIndex, newExercise);
        setExerciseData(workoutService.getExerciseData());
        if (selectedExercise === targetName) {
            setSelectedExercise(newName);
        }
    }, [openAnimatedMessage, selectedExercise]);

    useEffect(() => {
        const hasTemplate = route.params?.selectedWorkout;
        const unsubscribe = workoutService.subscribe((newData) => {
            if (!isFinishingWorkout.current) {
                setExerciseData(newData);
                setIsValidationPressed(workoutService.areAllSetsValidated());
            }
        });

        const initWorkout = async () => {
            if (hasTemplate) {
                await handleSelectedWorkout(route.params.selectedWorkout);
                setIsInitializing(false);
            } else {
                const restored = await workoutService.restoreWorkout();
                if (restored) {
                    workoutTimer.restore(restored.startTime);
                    setExerciseData(workoutService.getExerciseData());
                    setInputText(workoutService.getWorkoutNote());
                } else {
                    workoutService.startWorkout();
                    workoutTimer.start();
                    setExerciseData(workoutService.getExerciseData());
                }
                setIsInitializing(false);
            }
            workoutNotifications.init();
            refreshAllData();
        };

        initWorkout();
        isInitialized.current = true;
        return () => unsubscribe();
    }, [handleSelectedWorkout]);

    useFocusEffect(
        useCallback(() => {
            if (isInitialized.current && route.params?.selectedExercises) {
                const replaceTarget = pendingReplaceRef.current;
                if (replaceTarget) {
                    pendingReplaceRef.current = null;
                    replaceExerciseFromRoute(replaceTarget, route.params.selectedExercises);
                } else {
                    addNewExercisesFromRoute(route.params.selectedExercises);
                }
                navigation.setParams({ selectedExercises: undefined });
            }
            if (isInitialized.current && route.params?.selectedExercise) {
                setSelectedExercise(route.params.selectedExercise);
                navigation.setParams({ selectedExercise: undefined });
            }
        }, [route.params?.selectedExercises, route.params?.selectedExercise, addNewExercisesFromRoute, replaceExerciseFromRoute, navigation])
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
        await refreshAllData(true);
        navigation.goBack();
    }, [navigation, refreshAllData]);

    const handleFinishWorkout = useCallback(async () => {
        if (exerciseData.length === 0) {
            openAnimatedMessage('Add exercises to finish workout');
            return;
        }
        if (isFinishingWorkout.current) return;
        try {
            isFinishingWorkout.current = true;
            const result = await sendWorkoutDataToFirestore(
                [...exerciseData],
                inputText,
                workoutService.areAllSetsValidated(),
                navigation,
                openAnimatedMessage,
                () => workoutTimer.getFormattedTime(),
                workoutTimer.getElapsed(),
                route.params?.selectedWorkout?.templateName || 'Workout'
            );
            if (result === false) {
                isFinishingWorkout.current = false;
                return;
            }
            workoutTimer.stop();
            await workoutService.clearWorkout();
            await workoutNotifications.clear();
            await refreshAllData(true);
            isFinishingWorkout.current = false;
        } catch (error) {
            console.error('Error finishing workout:', error.message);
            Alert.alert('Error', 'An error occurred while finishing the workout.', [{ text: "OK" }]);
            isFinishingWorkout.current = false;
        }
    }, [exerciseData, inputText, navigation, openAnimatedMessage, refreshAllData, route.params]);

    const handleAddExercisePress = useCallback(async () => {
        if (!navigation) return;
        workoutService.startWorkout();
        await workoutService.persistWorkout();
        navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
    }, [navigation]);

    const handleScroll = useCallback((event) => {
        if (isKeyboardVisibleRef.current) {
            setIsCommandCenterVisible(false);
            return;
        }
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const canScroll = contentSize.height > layoutMeasurement.height;
        if (!canScroll) {
            setIsCommandCenterVisible(exerciseData.length > 0);
            return;
        }
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - normalize(50);
        setIsCommandCenterVisible(isAtBottom && exerciseData.length > 0);
    }, [exerciseData.length]);

    const renderEmptyState = useMemo(() => {
        if (isInitializing) {
            return (
                <View style={[styles.emptyStateContainer, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color="#FF9500" />
                </View>
            );
        }
        return (
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
        );
    }, [handleAddExercisePress, isInitializing]);

    const renderItem = useCallback(
        ({ item: exercise, index: exerciseIndex }) => {
            if (!exercise || !exercise.exerciseName) return null;
            return (
                <ExerciseInput
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    openAnimatedMessage={openAnimatedMessage}
                    onKeyboardChange={handleKeyboardChange}
                    focusedInputData={focusedInputData}
                    navigation={navigation}
                    onMenuPress={handleMenuPress}
                    onAddNote={onAddNote}
                />
            );
        },
        [openAnimatedMessage, handleKeyboardChange, focusedInputData, navigation, handleMenuPress, onAddNote]
    );

    useEffect(() => {
        if (isKeyboardVisible) {
            setIsCommandCenterVisible(false);
        } else if (exerciseData.length > 0) {
            setTimeout(() => setIsCommandCenterVisible(true), 100);
        }
    }, [isKeyboardVisible, exerciseData.length]);

    const filteredExerciseData = useMemo(
        () => exerciseData.filter(ex => ex && ex.exerciseName && Array.isArray(ex.sets)),
        [exerciseData]
    );

    const handleDismissKeyboard = useCallback(() => {
        setIsKeyboardVisible(false);
        setFocusedInputData(null);
        isKeyboardVisibleRef.current = false;
    }, []);

    const hasNavigatedBackRef = useRef(false);

    const handleBackPress = useCallback(() => {
        if (activeExerciseMenu) {
            setActiveExerciseMenu(null);
            return true;
        }
        if (isKeyboardVisibleRef.current) {
            setIsKeyboardVisible(false);
            setFocusedInputData(null);
            isKeyboardVisibleRef.current = false;
            return true;
        }
        if (hasNavigatedBackRef.current || !navigation.canGoBack()) {
            return true;
        }
        hasNavigatedBackRef.current = true;
        refreshAllData();
        navigation.goBack();
        return true;
    }, [navigation, activeExerciseMenu, refreshAllData]);

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () => backHandler.remove();
        }, [handleBackPress])
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            workoutService.setWorkoutNote(inputText);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputText]);

    const contentContainerStyle = useMemo(() => [
        styles.scrollViewContent,
        filteredExerciseData.length === 0 && styles.scrollViewContentEmpty,
        { paddingBottom: isKeyboardVisible ? normalize(350) + insets.bottom : normalize(140) + insets.bottom },
    ], [filteredExerciseData.length, isKeyboardVisible, insets.bottom]);

    if (isInitializing) {
        return (
            <View style={styles.container}>
                <View style={[styles.headerContainer, { paddingTop: insets.top + normalize(20) }]}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleExit} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TimerComponent />
                    <TouchableOpacity style={[styles.headerButton, styles.finishButton]} disabled={true} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                        <Text style={[styles.finishText, styles.finishTextDisabled]}>Finish</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FF9500" />
                </View>
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
                contentContainerStyle={contentContainerStyle}
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

            {isCommandCenterVisible && filteredExerciseData.length > 0 && (
                <View style={[styles.commandCenter, { bottom: normalize(32) + insets.bottom }]}>
                    <TouchableOpacity
                        style={styles.commandAdd}
                        onPress={handleAddExercisePress}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Text style={styles.commandButtonText}>+ Add Exercise</Text>
                    </TouchableOpacity>
                </View>
            )}

            {animatedMessage ? <AnimatedMessage message={animatedMessage} /> : null}

            {isKeyboardVisible && focusedInputData && (
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
            )}

            <ExerciseOptionsModal
                visible={!!activeExerciseMenu}
                onClose={handleMenuClose}
                exerciseName={activeExerciseMenu?.exercise?.exerciseName || ''}
                onReplace={handleMenuReplace}
                onDelete={handleMenuDelete}
                onAddNote={handleMenuAddNote}
                onMoveUp={handleMenuMoveUp}
                onMoveDown={handleMenuMoveDown}
                canMoveUp={canMoveActiveExerciseUp}
                canMoveDown={canMoveActiveExerciseDown}
            />
        </View>
    );
};

export default React.memo(StartWorkout);