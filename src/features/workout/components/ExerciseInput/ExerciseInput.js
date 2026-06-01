import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, Animated, TouchableOpacity, Keyboard } from 'react-native';
import { workoutService } from '../../services/WorkoutService';
import ExerciseHeader from './ExerciseHeader';
import SetRow from './SetRow';
import { styles } from './ExerciseInputStyles';

const ExerciseInput = ({
    exercise,
    exerciseIndex,
    openAnimatedMessage,
    onKeyboardChange,
    focusedInputData,
    navigation,
    onMenuPress,
}) => {
    const currentSets = useMemo(
        () => exercise?.sets || [],
        [exercise]
    );

    const animRefs = useRef({
        fade: [],
        cardEntry: new Animated.Value(0),
    }).current;

    const handleAddSetPress = useCallback(() => {
        workoutService.addSet(exerciseIndex);
    }, [exerciseIndex]);

    const handleMenuPress = useCallback(() => {
        onMenuPress(exercise, exerciseIndex);
    }, [onMenuPress, exercise, exerciseIndex]);

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

    const handlePreviousSetPress = useCallback((setIndex) => {
        const previousSet = exercise.lastWorkoutSets?.[setIndex];
        if (previousSet) {
            workoutService.updateWeight(exerciseIndex, setIndex, previousSet.weight?.toString() || '');
            workoutService.updateReps(exerciseIndex, setIndex, previousSet.reps?.toString() || '');
        } else {
            openAnimatedMessage('No previous set data available');
        }
    }, [exercise.lastWorkoutSets, exerciseIndex, openAnimatedMessage]);

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
            exercise={exercise}
            onKeyboardChange={onKeyboardChange}
            focusedInputData={focusedInputData}
            openAnimatedMessage={openAnimatedMessage}
        />
    )), [
        currentSets,
        exercise,
        exerciseIndex,
        animRefs.fade,
        handlePreviousSetPress,
        onKeyboardChange,
        focusedInputData,
        openAnimatedMessage,
    ]);

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <Animated.View style={[
                styles.exerciseCard,
                {
                    opacity: animRefs.cardEntry,
                    transform: [{
                        translateY: animRefs.cardEntry.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                        }),
                    }],
                },
            ]}>
                <ExerciseHeader
                    exercise={exercise}
                    navigation={navigation}
                    onMenuPress={handleMenuPress}
                />
                <View style={styles.dataGrid}>
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
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

ExerciseInput.whyDidYouRender = true;

export default React.memo(ExerciseInput, (prev, next) => {
    if (prev.exerciseIndex !== next.exerciseIndex) return false;
    if (prev.focusedInputData !== next.focusedInputData) return false;
    if (prev.exercise !== next.exercise) return false;
    if (prev.onMenuPress !== next.onMenuPress) return false;
    return true;
});