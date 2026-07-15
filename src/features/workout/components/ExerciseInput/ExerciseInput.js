import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Animated, TouchableOpacity, Keyboard, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { workoutService } from '../../services/WorkoutService';
import ExerciseHeader from './ExerciseHeader';
import SetRow from './SetRow';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const ExerciseInput = ({
    exercise,
    exerciseIndex,
    openAnimatedMessage,
    onKeyboardChange,
    focusedInputData,
    navigation,
    onMenuPress,
    onAddNote,
}) => {
    const currentSets = useMemo(() => exercise?.sets || [], [exercise]);

    const [isNoteVisible, setIsNoteVisible] = useState(!!exercise.note);
    const [noteText, setNoteText] = useState(exercise.note || '');
    const [isNoteFocused, setIsNoteFocused] = useState(false);
    const noteInputRef = useRef(null);

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

    const handleNoteBlur = useCallback(() => {
        setIsNoteFocused(false);
        const trimmed = noteText.trim();
        workoutService.setExerciseNote(exerciseIndex, trimmed);
        if (!trimmed) setIsNoteVisible(false);
    }, [noteText, exerciseIndex]);

    const handleNoteFocus = useCallback(() => {
        setIsNoteFocused(true);
        if (onKeyboardChange) {
            onKeyboardChange(false, null);
        }
    }, [onKeyboardChange]);

    const handleClearNote = useCallback(() => {
        setNoteText('');
        workoutService.setExerciseNote(exerciseIndex, '');
        setIsNoteVisible(false);
        setIsNoteFocused(false);
    }, [exerciseIndex]);

    const handleOutsidePress = useCallback(() => {
        Keyboard.dismiss();
        if (isNoteFocused) {
            noteInputRef.current?.blur();
        }
    }, [isNoteFocused]);

    useEffect(() => {
        if (onAddNote) {
            onAddNote.register(exerciseIndex, () => {
                setIsNoteVisible(true);
                setTimeout(() => noteInputRef.current?.focus(), 100);
            });
        }
    }, [exerciseIndex, onAddNote]);

    useEffect(() => {
        setNoteText(exercise.note || '');
        setIsNoteVisible(!!exercise.note);
    }, [exerciseIndex]);

    useEffect(() => {
        if (exercise.note !== undefined && exercise.note !== noteText) {
            setNoteText(exercise.note || '');
            setIsNoteVisible(!!exercise.note);
        }
    }, [exercise.note]);

    useEffect(() => {
        if (focusedInputData !== null && isNoteFocused) {
            noteInputRef.current?.blur();
            if (!noteText.trim()) {
                setIsNoteVisible(false);
            }
        }
    }, [focusedInputData]);

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
            key={data.id || `set-${exerciseIndex}-${setIndex}`}
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
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
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
                {isNoteVisible && (
                    <View style={styles.noteContainer}>
                        <Ionicons name="create-outline" size={spacing.iconSm} color={colors.text.tertiary} />
                        <TextInput
                            ref={noteInputRef}
                            style={styles.noteInput}
                            value={noteText}
                            onChangeText={setNoteText}
                            onFocus={handleNoteFocus}
                            onBlur={handleNoteBlur}
                            placeholder="Add a note..."
                            placeholderTextColor={colors.text.quaternary}
                            returnKeyType="done"
                            blurOnSubmit
                            onSubmitEditing={() => noteInputRef.current?.blur()}
                            maxLength={200}
                            multiline={false}
                            underlineColorAndroid="transparent"
                            autoCorrect={false}
                        />
                        {isNoteFocused && noteText.length > 0 && (
                            <TouchableOpacity
                                onPress={handleClearNote}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle-outline" size={spacing.iconSm} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
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

const styles = createStyles(() => ({
    exerciseCard: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: radius[5],
        marginHorizontal: spacing[3],
        marginBottom: spacing[5],
        overflow: 'hidden',
    },
    dataGrid: {
        backgroundColor: 'transparent',
    },
    gridHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    gridHeaderText: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.bold,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.text.secondary,
        textAlign: 'center',
    },
    gridHeaderSet: {
        width: spacing[10],
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridHeaderPrev: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[2],
    },
    gridHeaderWeight: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[2],
    },
    gridHeaderReps: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[2],
    },
    gridHeaderStatus: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    holoAddBtn: {
        marginHorizontal: spacing[4],
        marginVertical: spacing[4],
        backgroundColor: colors.faded.primary,
        borderColor: colors.border.primary,
        borderWidth: 1,
        borderRadius: radius[3],
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[3],
    },
    holoAddBtnText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.accent.primary,
        letterSpacing: 0.3,
    },
    errorText: {
        color: colors.accent.error,
        fontSize: fontSize[14],
        padding: spacing[4],
        textAlign: 'center',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: colors.faded.cyanDark,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.cyan,
        gap: spacing[2],
    },
    noteInput: {
        flex: 1,
        fontSize: fontSize[14],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        paddingVertical: spacing[1],
    },
}));

export default React.memo(ExerciseInput, (prev, next) => {
    if (prev.exerciseIndex !== next.exerciseIndex) return false;
    if (prev.focusedInputData !== next.focusedInputData) return false;
    if (prev.exercise !== next.exercise) return false;
    if (prev.onMenuPress !== next.onMenuPress) return false;
    if (prev.onAddNote !== next.onAddNote) return false;
    return true;
});