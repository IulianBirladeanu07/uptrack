import { useCallback, useRef, useState } from 'react';
import type { WorkoutExercise } from '../../types';

export type FocusedWorkoutInput = {
    type: 'weight' | 'reps';
    exerciseIndex: number;
    index: number;
};

export type WorkoutKeyboardInput = {
    type?: string;
    exerciseIndex?: number;
    index?: number;
} | null;

type WorkoutKeyboardNavigationOptions = {
    exerciseData: WorkoutExercise[];
    scrollToExercise: (exerciseIndex: number) => void;
};

export const useWorkoutKeyboardNavigation = ({
    exerciseData,
    scrollToExercise,
}: WorkoutKeyboardNavigationOptions) => {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInputData, setFocusedInputData] = useState<FocusedWorkoutInput | null>(null);
    const isKeyboardVisibleRef = useRef(false);

    const handleKeyboardChange = useCallback((visible: boolean, inputData: WorkoutKeyboardInput) => {
        isKeyboardVisibleRef.current = visible;
        if (
            visible &&
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
            setTimeout(() => scrollToExercise(exerciseIndex), 100);
        } else {
            setFocusedInputData(null);
            setIsKeyboardVisible(false);
        }
    }, [scrollToExercise]);

    const dismissKeyboard = useCallback(() => {
        setIsKeyboardVisible(false);
        setFocusedInputData(null);
        isKeyboardVisibleRef.current = false;
    }, []);

    const handleNext = useCallback(() => {
        if (!focusedInputData) return;
        const { type, exerciseIndex, index: setIndex } = focusedInputData;

        if (type === 'weight') {
            setFocusedInputData({ type: 'reps', exerciseIndex, index: setIndex });
            return;
        }

        const nextSetIndex = setIndex + 1;
        if (nextSetIndex < (exerciseData[exerciseIndex]?.sets.length || 0)) {
            setFocusedInputData({ type: 'weight', exerciseIndex, index: nextSetIndex });
            return;
        }

        const nextExerciseIndex = exerciseIndex + 1;
        if (nextExerciseIndex < exerciseData.length) {
            setFocusedInputData({ type: 'weight', exerciseIndex: nextExerciseIndex, index: 0 });
            setTimeout(() => scrollToExercise(nextExerciseIndex), 100);
            return;
        }

        dismissKeyboard();
    }, [dismissKeyboard, exerciseData, focusedInputData, scrollToExercise]);

    return {
        isKeyboardVisible,
        focusedInputData,
        isKeyboardVisibleRef,
        handleKeyboardChange,
        handleNext,
        dismissKeyboard,
    };
};
