import { useState, useEffect, useRef, useCallback, useMemo, useContext, memo } from 'react';
import { getAuth } from 'firebase/auth';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import { View, Text, TouchableOpacity, FlatList, BackHandler, Alert, ActivityIndicator } from 'react-native';
import type { FlatList as FlatListType, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedMessage from '../../../../shared/components/AnimatedMessage/AnimatedMessage';
import ExerciseInput from '../../components/ExerciseInput/ExerciseInput';
import ExerciseOptionsModal from '../../components/ExerciseOptionsModal/ExerciseOptionsModal';
import { sendWorkoutDataToFirestore } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutService, createEmptySet } from '../../services/WorkoutService';
import { isSameExercise } from '../../utils/exerciseIdentity';
import { workoutTimer, useWorkoutTimer } from '../../services/WorkoutTimerService';
import styles from './StartWorkoutStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import CustomNumericKeyboard from '../../components/CustomNumericKeyboard/CustomNumericKeyboard';
import type { WorkoutExercise, WorkoutSet } from '../../types';

type FocusedInputData = {
    type: 'weight' | 'reps';
    exerciseIndex: number;
    index: number;
};

type KeyboardInputData = {
    type?: string;
    exerciseIndex?: number;
    index?: number;
} | null;

type SelectedExercise = {
    exerciseName: string;
    name?: string;
    muscleGroup?: string;
    category?: string;
    imageURL?: string;
    repRange?: string;
};
type StartWorkoutRouteParams = {
    selectedWorkout?: unknown;
    selectedExercises?: unknown[];
    selectedExercise?: string;
};
type SelectedWorkout = {
    note?: string;
    exercises: WorkoutExercise[];
    templateName?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isCurrentUser = (uid: string | undefined): uid is string =>
    !!uid && getAuth().currentUser?.uid === uid;

const toWorkoutExercise = (value: unknown): WorkoutExercise | null => {
    if (!isRecord(value)) return null;
    const exerciseName =
        typeof value['exerciseName'] === 'string' ? value['exerciseName'] :
        typeof value['name'] === 'string' ? value['name'] :
        '';
    if (!exerciseName) return null;

    const inputSets = value['sets'];
    const sets: WorkoutSet[] = Array.isArray(inputSets)
        ? inputSets.filter(isRecord).map((set, index) => ({
            id: typeof set['id'] === 'string' ? set['id'] : `template-set-${index}`,
            weight: typeof set['weight'] === 'number' || typeof set['weight'] === 'string' ? String(set['weight']) : '',
            reps: typeof set['reps'] === 'number' || typeof set['reps'] === 'string' ? String(set['reps']) : '',
            isValidated: false,
            repsModified: false,
        }))
        : [];

    const exercise: WorkoutExercise = { exerciseName, sets };
    if (typeof value['name'] === 'string') exercise.name = value['name'];
    if (typeof value['muscleGroup'] === 'string') exercise.muscleGroup = value['muscleGroup'];
    if (typeof value['category'] === 'string') exercise.category = value['category'];
    if (typeof value['imageURL'] === 'string') exercise.imageURL = value['imageURL'];
    if (typeof value['numSets'] === 'number' || typeof value['numSets'] === 'string') exercise.numSets = value['numSets'];
    if (typeof value['repRange'] === 'string') exercise.repRange = value['repRange'];
    if (typeof value['note'] === 'string') exercise.note = value['note'];
    return exercise;
};

const toSelectedWorkout = (value: unknown): SelectedWorkout | null => {
    if (!isRecord(value) || !Array.isArray(value['exercises'])) return null;
    const workout: SelectedWorkout = {
        exercises: value['exercises'].map(toWorkoutExercise).filter((exercise): exercise is WorkoutExercise => exercise !== null),
    };
    if (typeof value['note'] === 'string') workout.note = value['note'];
    if (typeof value['templateName'] === 'string') workout.templateName = value['templateName'];
    return workout;
};

const toSelectedExercises = (value: unknown): SelectedExercise[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap(exercise => {
        if (!isRecord(exercise)) return [];
        const exerciseName =
            typeof exercise['exerciseName'] === 'string' ? exercise['exerciseName'] :
            typeof exercise['name'] === 'string' ? exercise['name'] :
            '';
        if (!exerciseName) return [];
        const selected: SelectedExercise = { exerciseName };
        if (typeof exercise['name'] === 'string') selected.name = exercise['name'];
        if (typeof exercise['muscleGroup'] === 'string') selected.muscleGroup = exercise['muscleGroup'];
        if (typeof exercise['category'] === 'string') selected.category = exercise['category'];
        if (typeof exercise['imageURL'] === 'string') selected.imageURL = exercise['imageURL'];
        if (typeof exercise['repRange'] === 'string') selected.repRange = exercise['repRange'];
        return [selected];
    });
};

const TimerComponent = () => {
    const { formattedTime } = useWorkoutTimer();
    return (
        <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={normalize(14)} color="#6B7280" style={{ marginRight: normalize(6) }} />
            <Text style={styles.timerText}>{formattedTime}</Text>
        </View>
    );
};

const StartWorkout = () => {
    const route = useAppRoute<'StartWorkout'>();
    const routeParams = route.params as StartWorkoutRouteParams | undefined;
    const navigation = useAppNavigation();
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [exerciseData, setExerciseData] = useState<WorkoutExercise[]>([]);
    const [inputText, setInputText] = useState('');
    const [, setIsValidationPressed] = useState(false);
    const [animatedMessage, setAnimatedMessage] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInputData, setFocusedInputData] = useState<FocusedInputData | null>(null);
    const [isCommandCenterVisible, setIsCommandCenterVisible] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [activeExerciseMenu, setActiveExerciseMenu] = useState<{ exercise: WorkoutExercise; exerciseIndex: number } | null>(null);

    const flatListRef = useRef<FlatListType<WorkoutExercise>>(null);
    const { refreshAllData, setActiveWorkout } = useContext(WorkoutContext)!;
    const insets = useSafeAreaInsets();
    const isFinishingWorkout = useRef(false);
    const isInitialized = useRef(false);
    const isKeyboardVisibleRef = useRef(false);
    const pendingReplaceRef = useRef<number | null>(null);
    const initializationGeneration = useRef(0);

    const syncActiveWorkout = useCallback(() => {
        const startTime = workoutService.getStartTime();
        if (!startTime) return;
        setActiveWorkout({
            startTime,
            exercises: workoutService.getExerciseData(),
            note: workoutService.getWorkoutNote(),
            templateName: workoutService.getWorkoutTemplateName(),
            isActive: true,
            lastSaved: Date.now(),
        });
    }, [setActiveWorkout]);

    const openAnimatedMessage = useCallback((message: string) => {
        setAnimatedMessage(message);
        setTimeout(() => setAnimatedMessage(''), 2000);
    }, []);

    const handleMenuPress = useCallback((exercise: WorkoutExercise, exerciseIndex: number) => {
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
        pendingReplaceRef.current = activeExerciseMenu.exerciseIndex;
        navigation.navigate('ExerciseSelection', {
            previousScreen: 'StartWorkout',
            replaceIndex: String(activeExerciseMenu.exerciseIndex),
        });
    }, [activeExerciseMenu, navigation]);

    const handleMenuDelete = useCallback(() => {
        if (!activeExerciseMenu) return;
        const { exerciseIndex } = activeExerciseMenu;
        const target = workoutService.getExerciseData()[exerciseIndex];
        const remove = () => workoutService.deleteExercise(exerciseIndex);
        if (!target?.sets.some(s => s.isValidated)) {
            remove();
            return;
        }
        Alert.alert('Delete Exercise', `Delete ${target.exerciseName} and its logged sets?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: remove },
        ]);
    }, [activeExerciseMenu]);

    const handleMenuMoveUp = useCallback(() => {
        if (!activeExerciseMenu) return;
        workoutService.moveExercise(activeExerciseMenu.exerciseIndex, -1);
        setActiveExerciseMenu(prev => (prev ? { ...prev, exerciseIndex: prev.exerciseIndex - 1 } : prev));
    }, [activeExerciseMenu]);

    const handleMenuMoveDown = useCallback(() => {
        if (!activeExerciseMenu) return;
        workoutService.moveExercise(activeExerciseMenu.exerciseIndex, 1);
        setActiveExerciseMenu(prev => (prev ? { ...prev, exerciseIndex: prev.exerciseIndex + 1 } : prev));
    }, [activeExerciseMenu]);

    const canMoveActiveExerciseUp = !!activeExerciseMenu && activeExerciseMenu.exerciseIndex > 0;
    const canMoveActiveExerciseDown = !!activeExerciseMenu && activeExerciseMenu.exerciseIndex < exerciseData.length - 1;

    const noteRegistryRef = useRef<Record<number, () => void>>({});

    const onAddNote = useMemo(() => ({
        register: (exerciseIndex: number, fn: () => void) => {
            noteRegistryRef.current[exerciseIndex] = fn;
        },
    }), []);

    const handleMenuAddNote = useCallback(() => {
        if (!activeExerciseMenu) return;
        const trigger = noteRegistryRef.current[activeExerciseMenu.exerciseIndex];
        if (trigger) trigger();
    }, [activeExerciseMenu]);

    const handleKeyboardChange = useCallback((isVisible: boolean, inputData: KeyboardInputData) => {
        isKeyboardVisibleRef.current = isVisible;
        if (
            isVisible &&
            inputData &&
            (inputData.type === 'weight' || inputData.type === 'reps') &&
            typeof inputData.exerciseIndex === 'number' &&
            typeof inputData.index === 'number'
        ) {
            const exerciseIndex = inputData.exerciseIndex;
            setFocusedInputData({
                type: inputData.type,
                exerciseIndex,
                index: inputData.index,
            });
            setIsKeyboardVisible(true);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: exerciseIndex,
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
        let nextFocus: FocusedInputData | null = null;
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

    const handleSelectedWorkout = useCallback(async (
        { note, exercises, templateName }: SelectedWorkout,
        requestGeneration: number
    ) => {
        if (!exercises || !Array.isArray(exercises)) return;
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentUser(uid)) return;
        workoutService.startWorkout();
        workoutService.setWorkoutTemplateName(templateName || '');
        setInputText(note || '');
        workoutService.setWorkoutNote(note || '');
        syncActiveWorkout();
        const loadedData = await workoutService.loadWorkoutFromTemplate(exercises);
        if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
        setExerciseData(loadedData);
        workoutTimer.start();
        setSelectedExercise(loadedData[0]?.exerciseName || null);
        setIsValidationPressed(false);
    }, [syncActiveWorkout]);

    const addNewExercisesFromRoute = useCallback(async (exercises: unknown) => {
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentUser(uid)) return;
        const requestGeneration = initializationGeneration.current;
        const selectedExercises = toSelectedExercises(exercises);
        if (selectedExercises.length === 0) return;
        const currentData = workoutService.getExerciseData();
        const newExercises: WorkoutExercise[] = [];

        for (const ex of selectedExercises) {
            if ([...currentData, ...newExercises].some(existing => isSameExercise(existing, ex))) continue;
            const lastSets = await workoutService.fetchLastSets(ex.exerciseName, ex.muscleGroup);
            if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
            newExercises.push({
                exerciseName: ex.exerciseName,
                muscleGroup: ex.muscleGroup || '',
                category: ex.category || '',
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

    const replaceExerciseFromRoute = useCallback(async (targetIndex: number, selected: unknown) => {
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentUser(uid)) return;
        const requestGeneration = initializationGeneration.current;
        const incoming = toSelectedExercises(Array.isArray(selected) ? selected : [selected])[0];
        if (!incoming) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }
        const newName = incoming.exerciseName;

        const currentData = workoutService.getExerciseData();
        const replaced = currentData[targetIndex];
        if (!replaced) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }

        const isDuplicate = currentData.some((ex, idx) =>
            idx !== targetIndex &&
            isSameExercise(ex, incoming)
        );
        if (isDuplicate) {
            openAnimatedMessage('This exercise is already added.');
            return;
        }

        const lastSets = await workoutService.fetchLastSets(newName, incoming.muscleGroup);
        if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
        const newExercise = {
            exerciseName: newName,
            muscleGroup: incoming.muscleGroup || '',
            category: incoming.category || '',
            imageURL: incoming.imageURL || '',
            sets: replaced.sets.map(() => createEmptySet()),
            lastWorkoutSets: lastSets,
            repRange: incoming.repRange || replaced.repRange || '',
        };

        workoutService.replaceExercise(targetIndex, newExercise);
        setExerciseData(workoutService.getExerciseData());
        if (selectedExercise === replaced.exerciseName) {
            setSelectedExercise(newName);
        }
    }, [openAnimatedMessage, selectedExercise]);

    useEffect(() => {
        const selectedWorkout = toSelectedWorkout(routeParams?.selectedWorkout);
        const requestGeneration = ++initializationGeneration.current;
        const unsubscribe = workoutService.subscribe((newData) => {
            if (!isFinishingWorkout.current) {
                setExerciseData(newData);
                setIsValidationPressed(workoutService.areAllSetsValidated());
            }
        });

        const initWorkout = async () => {
            const uid = getAuth().currentUser?.uid;
            if (!isCurrentUser(uid)) return;
            if (selectedWorkout) {
                await handleSelectedWorkout(selectedWorkout, requestGeneration);
                if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
                setIsInitializing(false);
            } else {
                const restored = await workoutService.restoreWorkout();
                if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
                if (restored) {
                    workoutTimer.restore(restored.startTime);
                    setExerciseData(workoutService.getExerciseData());
                    setInputText(workoutService.getWorkoutNote());
                } else {
                    workoutService.startWorkout();
                    workoutTimer.start();
                    setInputText('');
                    setExerciseData(workoutService.getExerciseData());
                }
                setIsInitializing(false);
            }
            syncActiveWorkout();
            refreshAllData();
        };

        initWorkout();
        isInitialized.current = true;
        return () => {
            unsubscribe();
            if (requestGeneration === initializationGeneration.current) {
                initializationGeneration.current++;
            }
        };
    }, [handleSelectedWorkout, refreshAllData, syncActiveWorkout]);

    useFocusEffect(
        useCallback(() => {
            if (isInitialized.current && routeParams?.selectedExercises) {
                const replaceTarget = pendingReplaceRef.current;
                if (replaceTarget !== null) {
                    pendingReplaceRef.current = null;
                    replaceExerciseFromRoute(replaceTarget, routeParams.selectedExercises);
                } else {
                    addNewExercisesFromRoute(routeParams.selectedExercises);
                }
                navigation.setParams({ selectedExercises: undefined });
            }
            if (isInitialized.current && routeParams?.selectedExercise) {
                setSelectedExercise(routeParams.selectedExercise);
            }
        }, [routeParams?.selectedExercises, routeParams?.selectedExercise, addNewExercisesFromRoute, replaceExerciseFromRoute, navigation])
    );

    const confirmExit = useCallback(async (uid: string) => {
        if (!isCurrentUser(uid) || workoutService.uid !== uid) return;
        initializationGeneration.current++;
        workoutTimer.stop();
        await workoutService.clearWorkout();
        if (!isCurrentUser(uid) || workoutService.uid !== uid) return;
        setActiveWorkout(null);
        setInputText('');
        await refreshAllData(true);
        if (!isCurrentUser(uid) || workoutService.uid !== uid) return;
        navigation.goBack();
    }, [navigation, refreshAllData, setActiveWorkout]);

    const handleExit = useCallback(() => {
        if (isFinishingWorkout.current) return;
        const uid = getAuth().currentUser?.uid;
        if (!uid || workoutService.uid !== uid) return;
        Alert.alert("Exit Workout", "Are you sure you want to exit the workout?", [
            { text: "Cancel", style: "cancel" },
            { text: "YES", onPress: () => confirmExit(uid) },
        ]);
    }, [confirmExit]);

    const handleFinishWorkout = useCallback(async () => {
        if (isFinishingWorkout.current) return;
        const uid = getAuth().currentUser?.uid;
        if (!uid || workoutService.uid !== uid) {
            openAnimatedMessage('Unable to finish this workout because the signed-in account changed.');
            return;
        }
        const currentExerciseData = workoutService.getExerciseData().map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({ ...set })),
            ...(exercise.lastWorkoutSets
                ? { lastWorkoutSets: exercise.lastWorkoutSets.map(set => ({ ...set })) }
                : {}),
        }));
        if (currentExerciseData.length === 0) {
            openAnimatedMessage('Add exercises to finish workout');
            return;
        }
        try {
            isFinishingWorkout.current = true;
            const result = await sendWorkoutDataToFirestore(
                currentExerciseData,
                inputText,
                workoutService.areAllSetsValidated(),
                navigation,
                openAnimatedMessage,
                () => workoutTimer.getFormattedTime(),
                workoutTimer.getElapsed(),
                uid,
                workoutService.getWorkoutTemplateName() || 'Workout'
            );
            if (result === false) {
                isFinishingWorkout.current = false;
                return;
            }
            if (getAuth().currentUser?.uid !== uid || workoutService.uid !== uid) {
                isFinishingWorkout.current = false;
                return;
            }
            initializationGeneration.current++;
            workoutTimer.stop();
            await workoutService.clearWorkout();
            setActiveWorkout(null);
            setInputText('');
            await refreshAllData(true);
            isFinishingWorkout.current = false;
        } catch (error) {
            console.error('Error finishing workout:', error instanceof Error ? error.message : String(error));
            Alert.alert('Error', 'An error occurred while finishing the workout.', [{ text: "OK" }]);
            isFinishingWorkout.current = false;
        }
    }, [inputText, navigation, openAnimatedMessage, refreshAllData, setActiveWorkout]);

    const handleAddExercisePress = useCallback(async () => {
        if (!navigation) return;
        workoutService.startWorkout();
        await workoutService.persistWorkout();
        navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
    }, [navigation]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
        ({ item: exercise, index: exerciseIndex }: ListRenderItemInfo<WorkoutExercise>) => {
            if (!exercise || !exercise.exerciseName) return null;
            return (
                <ExerciseInput
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    openAnimatedMessage={openAnimatedMessage}
                    onKeyboardChange={handleKeyboardChange}
                    focusedInputData={focusedInputData}
                    navigation={{
                        navigate: (screen: string, params?: object) => {
                            if (screen === 'ExerciseHistory' && isRecord(params) && typeof params['exerciseName'] === 'string') {
                                navigation.navigate('ExerciseHistory', {
                                    exerciseName: params['exerciseName'],
                                    ...(typeof params['muscleGroup'] === 'string'
                                        ? { muscleGroup: params['muscleGroup'] }
                                        : {}),
                                });
                            }
                        },
                    }}
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
        if (isFinishingWorkout.current) return true;
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
            hasNavigatedBackRef.current = false;
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
                position={(activeExerciseMenu?.exerciseIndex ?? 0) + 1}
                count={exerciseData.length}
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

export default memo(StartWorkout);