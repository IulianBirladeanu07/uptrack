import { useState, useEffect, useRef, useCallback, useMemo, useContext, memo } from 'react';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import { View, Text, TouchableOpacity, FlatList, BackHandler, ActivityIndicator } from 'react-native';
import type { FlatList as FlatListType, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedMessage from '../../../../shared/components/AnimatedMessage/AnimatedMessage';
import ExerciseInput from '../../components/ExerciseInput/ExerciseInput';
import ExerciseOptionsModal from '../../components/ExerciseOptionsModal/ExerciseOptionsModal';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutService } from '../../services/WorkoutService';
import { useWorkoutTimer } from '../../services/WorkoutTimerService';
import styles from './StartWorkoutStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import CustomNumericKeyboard from '../../components/CustomNumericKeyboard/CustomNumericKeyboard';
import type { WorkoutExercise } from '../../types';
import { buildExerciseRowKeys } from '../../utils/exerciseIdentity';
import { useWorkoutSessionInitialization } from './useWorkoutSessionInitialization';
import { useWorkoutExerciseSelection } from './useWorkoutExerciseSelection';
import { useWorkoutSessionActions } from './useWorkoutSessionActions';
import { useWorkoutKeyboardNavigation } from './useWorkoutKeyboardNavigation';
import { useWorkoutExerciseMenu } from './useWorkoutExerciseMenu';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

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
    const routeParams = route.params;
    const navigation = useAppNavigation();
    const [, setIsValidationPressed] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [exerciseData, setExerciseData] = useState<WorkoutExercise[]>([]);
    const [inputText, setInputText] = useState('');
    const [animatedMessage, setAnimatedMessage] = useState('');
    const [isCommandCenterVisible, setIsCommandCenterVisible] = useState(false);

    const flatListRef = useRef<FlatListType<WorkoutExercise>>(null);
    const { refreshAllData, setActiveWorkout } = useContext(WorkoutContext)!;
    const insets = useSafeAreaInsets();
    const scrollToExercise = useCallback((exerciseIndex: number) => {
        flatListRef.current?.scrollToIndex({
            index: exerciseIndex,
            animated: true,
            viewPosition: 0.2,
        });
    }, []);
    const {
        isKeyboardVisible,
        focusedInputData,
        isKeyboardVisibleRef,
        handleKeyboardChange,
        handleNext,
        dismissKeyboard: handleDismissKeyboard,
    } = useWorkoutKeyboardNavigation({ exerciseData, scrollToExercise });
    const {
        isInitializing,
        isFinishingWorkout,
        isInitialized,
        initializationGeneration,
    } = useWorkoutSessionInitialization({
        selectedWorkout: routeParams?.selectedWorkout,
        setExerciseData,
        setInputText,
        setSelectedExercise,
        setIsValidationPressed,
        setActiveWorkout,
        refreshAllData,
    });
    const openAnimatedMessage = useCallback((message: string) => {
        setAnimatedMessage(message);
        setTimeout(() => setAnimatedMessage(''), 2000);
    }, []);

    const exerciseSelection = useWorkoutExerciseSelection({
        initializationGeneration,
        selectedExercise,
        setSelectedExercise,
        setExerciseData,
        openAnimatedMessage,
    });
    const { markExerciseForReplacement, takePendingReplacement, addNewExercisesFromRoute, replaceExerciseFromRoute } =
        exerciseSelection;
    const { handleExit, handleFinishWorkout } = useWorkoutSessionActions({
        inputText,
        navigation,
        refreshAllData,
        setActiveWorkout,
        setInputText,
        openAnimatedMessage,
        initializationGeneration,
        isFinishingWorkout,
    });

    const {
        activeExerciseMenu,
        canMoveActiveExerciseUp,
        canMoveActiveExerciseDown,
        onAddNote,
        handleMenuPress,
        handleMenuClose,
        handleMenuReplace,
        handleMenuDelete,
        handleMenuMoveUp,
        handleMenuMoveDown,
        handleMenuAddNote,
    } = useWorkoutExerciseMenu({
        exerciseCount: exerciseData.length,
        isKeyboardVisibleRef,
        dismissKeyboard: handleDismissKeyboard,
        navigation,
        markExerciseForReplacement,
    });

    useFocusEffect(
        useCallback(() => {
            if (isInitialized.current && routeParams?.selectedExercises) {
                const replaceTarget = takePendingReplacement();
                if (replaceTarget !== null) {
                    replaceExerciseFromRoute(replaceTarget, routeParams.selectedExercises);
                } else {
                    addNewExercisesFromRoute(routeParams.selectedExercises);
                }
                navigation.setParams({ selectedExercises: undefined });
            }
            if (isInitialized.current && routeParams?.selectedExercise) {
                setSelectedExercise(routeParams.selectedExercise);
            }
        }, [
            routeParams?.selectedExercises,
            routeParams?.selectedExercise,
            addNewExercisesFromRoute,
            replaceExerciseFromRoute,
            takePendingReplacement,
            navigation,
        ])
    );

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
                        accessibilityRole="button"
                        accessibilityLabel="Add exercise"
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

    const rowKeys = useMemo(() => buildExerciseRowKeys(filteredExerciseData), [filteredExerciseData]);

    const hasNavigatedBackRef = useRef(false);

    const handleBackPress = useCallback(() => {
        if (isFinishingWorkout.current) return true;
        if (activeExerciseMenu) {
            handleMenuClose();
            return true;
        }
        if (isKeyboardVisibleRef.current) {
            handleDismissKeyboard();
            return true;
        }
        if (hasNavigatedBackRef.current || !navigation.canGoBack()) {
            return true;
        }
        hasNavigatedBackRef.current = true;
        refreshAllData();
        navigation.goBack();
        return true;
    }, [navigation, activeExerciseMenu, handleMenuClose, refreshAllData, handleDismissKeyboard, isKeyboardVisibleRef]);

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
                    <TouchableOpacity style={styles.headerButton} onPress={handleExit} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} accessibilityRole="button" accessibilityLabel="Cancel workout">
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TimerComponent />
                    <TouchableOpacity style={[styles.headerButton, styles.finishButton]} disabled={true} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} accessibilityRole="button" accessibilityLabel="Finish workout" accessibilityState={{ disabled: true }}>
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
                <TouchableOpacity style={styles.headerButton} onPress={handleExit} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} accessibilityRole="button" accessibilityLabel="Cancel workout">
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TimerComponent />
                <TouchableOpacity
                    style={[styles.headerButton, styles.finishButton]}
                    onPress={handleFinishWorkout}
                    disabled={exerciseData.length === 0}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    accessibilityRole="button"
                    accessibilityLabel="Finish workout"
                    accessibilityState={{ disabled: exerciseData.length === 0 }}
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
                keyExtractor={(item, index) => rowKeys[index] ?? `${item.exerciseName}-${index}`}
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
                        accessibilityRole="button"
                        accessibilityLabel="Add exercise"
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