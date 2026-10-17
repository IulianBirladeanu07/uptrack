import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { workoutService } from '../../services/WorkoutService';
import type { WorkoutExercise } from '../../types';
import type { useAppNavigation } from '../../../../shared/navigation';

type Navigation = ReturnType<typeof useAppNavigation>;

type WorkoutExerciseMenuOptions = {
    exerciseCount: number;
    isKeyboardVisibleRef: { current: boolean };
    dismissKeyboard: () => void;
    navigation: Navigation;
    markExerciseForReplacement: (exerciseIndex: number) => void;
};

export const useWorkoutExerciseMenu = ({
    exerciseCount,
    isKeyboardVisibleRef,
    dismissKeyboard,
    navigation,
    markExerciseForReplacement,
}: WorkoutExerciseMenuOptions) => {
    const [activeExerciseMenu, setActiveExerciseMenu] = useState<{
        exercise: WorkoutExercise;
        exerciseIndex: number;
    } | null>(null);
    const noteRegistryRef = useRef<Record<number, () => void>>({});

    const handleMenuPress = useCallback((exercise: WorkoutExercise, exerciseIndex: number) => {
        if (isKeyboardVisibleRef.current) dismissKeyboard();
        setActiveExerciseMenu({ exercise, exerciseIndex });
    }, [dismissKeyboard, isKeyboardVisibleRef]);

    const handleMenuClose = useCallback(() => {
        setActiveExerciseMenu(null);
    }, []);

    const handleMenuReplace = useCallback(() => {
        if (!activeExerciseMenu) return;
        markExerciseForReplacement(activeExerciseMenu.exerciseIndex);
        navigation.navigate('ExerciseSelection', {
            previousScreen: 'StartWorkout',
            replaceIndex: String(activeExerciseMenu.exerciseIndex),
        });
    }, [activeExerciseMenu, markExerciseForReplacement, navigation]);

    const handleMenuDelete = useCallback(() => {
        if (!activeExerciseMenu) return;
        const { exerciseIndex } = activeExerciseMenu;
        const target = workoutService.getExerciseData()[exerciseIndex];
        const remove = () => workoutService.deleteExercise(exerciseIndex);
        if (!target?.sets.some(set => set.isValidated)) {
            remove();
            return;
        }
        Alert.alert('Delete Exercise', `Delete ${target.exerciseName} and its logged sets?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: remove },
        ]);
    }, [activeExerciseMenu]);

    const handleMenuMove = useCallback((direction: -1 | 1) => {
        if (!activeExerciseMenu) return;
        const nextIndex = activeExerciseMenu.exerciseIndex + direction;
        if (nextIndex < 0 || nextIndex >= exerciseCount) return;
        workoutService.moveExercise(activeExerciseMenu.exerciseIndex, direction);
        setActiveExerciseMenu(prev => (
            prev ? { ...prev, exerciseIndex: nextIndex } : prev
        ));
    }, [activeExerciseMenu, exerciseCount]);

    const handleMenuMoveUp = useCallback(() => handleMenuMove(-1), [handleMenuMove]);
    const handleMenuMoveDown = useCallback(() => handleMenuMove(1), [handleMenuMove]);

    const onAddNote = useMemo(() => ({
        register: (exerciseIndex: number, trigger: () => void) => {
            noteRegistryRef.current[exerciseIndex] = trigger;
        },
    }), []);

    const handleMenuAddNote = useCallback(() => {
        if (!activeExerciseMenu) return;
        noteRegistryRef.current[activeExerciseMenu.exerciseIndex]?.();
    }, [activeExerciseMenu]);

    return {
        activeExerciseMenu,
        canMoveActiveExerciseUp: !!activeExerciseMenu && activeExerciseMenu.exerciseIndex > 0,
        canMoveActiveExerciseDown: !!activeExerciseMenu && activeExerciseMenu.exerciseIndex < exerciseCount - 1,
        onAddNote,
        handleMenuPress,
        handleMenuClose,
        handleMenuReplace,
        handleMenuDelete,
        handleMenuMoveUp,
        handleMenuMoveDown,
        handleMenuAddNote,
    };
};
