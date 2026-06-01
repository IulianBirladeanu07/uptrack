import React, { useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { workoutService } from '../../services/WorkoutService';
import PreviousSetDisplay from './PreviousSetDisplay';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const SWIPE_THRESHOLD = -80;
const SPRING_CONFIG = { damping: 25, stiffness: 400, mass: 0.5 };

const NumericInput = memo(({ value, placeholder, isFocused, isValidated, isModified, onPress, style, textStyle }) => {
    const inputStyle = useMemo(() => [
        style.neuralInput,
        isValidated && style.neuralInputCompleted,
        isFocused && style.neuralInputFocused,
    ], [isValidated, isFocused, style]);

    const contentText = value ? String(value) : placeholder;

    const contentTextStyle = useMemo(() => [
        textStyle.neuralInputText,
        !value && textStyle.neuralInputTextPlaceholder,
        !value && isFocused && textStyle.neuralInputTextPlaceholderFocused,
        isFocused && textStyle.neuralInputTextFocused,
        value && !isFocused && isModified && textStyle.neuralInputTextFilled,
        value && !isFocused && !isModified && isValidated && textStyle.neuralInputTextFilled,
    ], [value, isFocused, isModified, isValidated, textStyle]);

    return (
        <TouchableOpacity
            style={style.inputTouchable}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <View style={inputStyle} pointerEvents="none">
                <Text style={contentTextStyle}>
                    {contentText}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const SetRow = ({
    setData = {},
    setIndex,
    exerciseIndex,
    previousSetData = {},
    handlePreviousSetPress,
    totalSetsInExercise,
    fadeAnim = [],
    exercise,
    onKeyboardChange,
    openAnimatedMessage,
    focusedInputData,
}) => {
    const translateX = useSharedValue(0);
    const deleteProgress = useSharedValue(0);
    const hasTriggeredHaptic = useSharedValue(false);

    const lastPressTime = useRef(0);

    const isThisRowFocused = focusedInputData?.exerciseIndex === exerciseIndex &&
                            focusedInputData?.index === setIndex;

    const isWeightFocused = isThisRowFocused && focusedInputData?.type === 'weight';
    const isRepsFocused = isThisRowFocused && focusedInputData?.type === 'reps';

    const confirmDelete = useCallback(() => {
        const handleDelete = () => {
            if (totalSetsInExercise === 1) {
                Alert.alert(
                    "Delete Exercise",
                    "This is the last set. Deleting it will remove the entire exercise. Continue?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                translateX.value = withSpring(0, SPRING_CONFIG);
                                deleteProgress.value = withSpring(0, SPRING_CONFIG);
                            }
                        },
                        {
                            text: "Delete Exercise",
                            style: "destructive",
                            onPress: () => workoutService.deleteSet(exerciseIndex, setIndex),
                        }
                    ]
                );
            } else if (setData.isValidated) {
                Alert.alert(
                    "Delete Completed Set",
                    "This set is marked as complete. Are you sure you want to delete it?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                translateX.value = withSpring(0, SPRING_CONFIG);
                                deleteProgress.value = withSpring(0, SPRING_CONFIG);
                            }
                        },
                        {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => workoutService.deleteSet(exerciseIndex, setIndex),
                        }
                    ]
                );
            } else {
                workoutService.deleteSet(exerciseIndex, setIndex);
            }
        };

        handleDelete();
    }, [exerciseIndex, setIndex, setData.isValidated, totalSetsInExercise, translateX, deleteProgress]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-8, 8])
        .onUpdate((event) => {
            'worklet';
            const x = Math.max(SWIPE_THRESHOLD, Math.min(0, event.translationX));
            const newProgress = Math.abs(x / SWIPE_THRESHOLD);
            translateX.value = x;
            deleteProgress.value = newProgress;
            if (!hasTriggeredHaptic.value && newProgress >= 1) {
                hasTriggeredHaptic.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
        })
        .onEnd((event) => {
            'worklet';
            if (event.translationX < SWIPE_THRESHOLD) {
                runOnJS(confirmDelete)();
            } else {
                translateX.value = withSpring(0, SPRING_CONFIG);
                deleteProgress.value = withSpring(0, SPRING_CONFIG);
            }
            hasTriggeredHaptic.value = false;
        });

    const animatedRowStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [
                { translateX: translateX.value },
                { scale: 1 - (deleteProgress.value * 0.015) },
            ],
        };
    }, []);

    const checkStaticStyle = useMemo(() => ({
        backgroundColor: setData.isValidated
            ? colors.faded.cyan
            : colors.background.tertiary,
        borderColor: setData.isValidated
            ? colors.border.cyanBright
            : colors.border.default,
    }), [setData.isValidated]);

    const animatedCheckStyle = useAnimatedStyle(() => {
        'worklet';
        const progress = deleteProgress.value;
        if (progress === 0) return {};
        return {
            transform: [
                { scale: 1 + (progress * 0.12) },
                { rotate: `${progress * 90}deg` },
            ],
            backgroundColor: progress > 0.5
                ? `rgba(255, 69, 58, ${0.15 + progress * 0.85})`
                : undefined,
            borderColor: progress > 0.5
                ? `rgba(255, 69, 58, ${0.5 + progress * 0.5})`
                : undefined,
        };
    }, []);

    const animatedTrashStyle = useAnimatedStyle(() => {
        'worklet';
        return { opacity: deleteProgress.value };
    }, []);

    const animatedCheckmarkStyle = useAnimatedStyle(() => {
        'worklet';
        return { opacity: 1 - deleteProgress.value };
    }, []);

    const handleValidationPress = useCallback(() => {
        try {
            const reps = String(setData.reps || '').trim();
            const weight = String(setData.weight || '').trim();

            if (!setData.isValidated && (!reps || !weight)) {
                if (openAnimatedMessage) {
                    openAnimatedMessage('Enter weight and reps first');
                }
                return;
            }

            workoutService.toggleValidation(exerciseIndex, setIndex);
        } catch (error) {
            console.error('Error in validation:', error);
        }
    }, [exerciseIndex, setIndex, setData, openAnimatedMessage]);

    const handleInputPress = useCallback((inputType) => {
        const now = Date.now();
        if (now - lastPressTime.current < 200) return;
        lastPressTime.current = now;

        if (onKeyboardChange && typeof onKeyboardChange === 'function') {
            onKeyboardChange(true, { type: inputType, index: setIndex, exerciseIndex });
        }
    }, [setIndex, exerciseIndex, onKeyboardChange]);

    const inputStyles = useMemo(() => ({
        neuralInput: stylesLocal.neuralInput,
        neuralInputCompleted: stylesLocal.neuralInputCompleted,
        neuralInputFocused: stylesLocal.neuralInputFocused,
        inputTouchable: stylesLocal.inputTouchable,
    }), []);

    const inputTextStyles = useMemo(() => ({
        neuralInputText: stylesLocal.neuralInputText,
        neuralInputTextPlaceholder: stylesLocal.neuralInputTextPlaceholder,
        neuralInputTextPlaceholderFocused: stylesLocal.neuralInputTextPlaceholderFocused,
        neuralInputTextFocused: stylesLocal.neuralInputTextFocused,
        neuralInputTextFilled: stylesLocal.neuralInputTextFilled,
    }), []);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedRowStyle}>
                <View style={[
                    stylesLocal.dataRow,
                    setData.isValidated && stylesLocal.completedRow,
                ]}>
                    <View style={stylesLocal.setColumn}>
                        <Text style={[
                            stylesLocal.setNumberText,
                            setData.isValidated && stylesLocal.setNumberTextCompleted,
                        ]}>
                            {String(setIndex + 1)}
                        </Text>
                    </View>

                    <View style={stylesLocal.prevColumn}>
                        <PreviousSetDisplay
                            previousSetData={previousSetData}
                            onPress={handlePreviousSetPress}
                            setIndex={setIndex}
                            isCompleted={setData.isValidated}
                        />
                    </View>

                    <View style={stylesLocal.inputWrapper}>
                        <NumericInput
                            value={setData.weight}
                            placeholder="kg"
                            isFocused={isWeightFocused}
                            isValidated={setData.isValidated}
                            isModified={setData.weightModified}
                            onPress={() => handleInputPress('weight')}
                            style={inputStyles}
                            textStyle={inputTextStyles}
                        />
                    </View>

                    <View style={stylesLocal.inputWrapper}>
                        <NumericInput
                            value={setData.reps}
                            placeholder="reps"
                            isFocused={isRepsFocused}
                            isValidated={setData.isValidated}
                            isModified={setData.repsModified}
                            onPress={() => handleInputPress('reps')}
                            style={inputStyles}
                            textStyle={inputTextStyles}
                        />
                    </View>

                    <View style={stylesLocal.statusColumn}>
                        <TouchableOpacity
                            onPress={handleValidationPress}
                            activeOpacity={0.7}
                            hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                        >
                            <Animated.View style={[stylesLocal.quantumCheck, checkStaticStyle, animatedCheckStyle]}>
                                <Animated.View style={[StyleSheet.absoluteFill, stylesLocal.overlay, animatedCheckmarkStyle]}>
                                    <Text style={stylesLocal.quantumCheckText}>✓</Text>
                                </Animated.View>
                                <Animated.View style={[StyleSheet.absoluteFill, stylesLocal.overlay, animatedTrashStyle]}>
                                    <MaterialCommunityIcons
                                        name="trash-can-outline"
                                        size={spacing.icon}
                                        color={colors.text.primary}
                                    />
                                </Animated.View>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};

const stylesLocal = createStyles(() => ({
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing[4],
        paddingRight: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        borderLeftWidth: 2,
        borderLeftColor: 'transparent',
        minHeight: spacing[15],
    },
    completedRow: {
        backgroundColor: colors.faded.cyanExtraLight,
        borderLeftColor: colors.border.cyanStrong,
    },
    setColumn: {
        width: spacing[10],
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberText: {
        textAlign: 'center',
        color: colors.text.tertiary,
        fontSize: fontSize[16],
        fontWeight: fontWeight.semibold,
        letterSpacing: 0.2,
    },
    setNumberTextCompleted: {
        color: colors.accent.cyan,
        opacity: 0.7,
    },
    prevColumn: {
        width: 90,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[2],
    },
    inputWrapper: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[2],
    },
    inputTouchable: {
        width: '100%',
    },
    statusColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    neuralInput: {
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderWidth: 2,
        borderColor: colors.border.default,
        borderRadius: radius[3],
        paddingHorizontal: spacing[2],
        height: spacing[11],
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    neuralInputFocused: {
        borderColor: colors.border.primaryAlt,
        borderWidth: 2,
        backgroundColor: colors.faded.primaryLight,
    },
    neuralInputCompleted: {
        borderColor: colors.border.cyanStrong,
        backgroundColor: colors.faded.cyanDark,
    },
    neuralInputText: {
        color: colors.text.quaternary,
        fontSize: fontSize[16],
        fontWeight: fontWeight.semibold,
        textAlign: 'center',
        lineHeight: 16,
        letterSpacing: 0.2,
    },
    neuralInputTextFilled: {
        color: colors.text.tertiary,
    },
    neuralInputTextPlaceholder: {
        color: colors.text.quaternary,
        opacity: 0.6,
        fontWeight: fontWeight.medium,
        fontSize: fontSize[12],
        lineHeight: 20,
    },
    neuralInputTextPlaceholderFocused: {
        opacity: 0.8,
        color: colors.accent.primary,
    },
    neuralInputTextFocused: {
        color: colors.accent.primary,
    },
    quantumCheck: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[4],
        borderWidth: 2,
    },
    quantumCheckText: {
        fontSize: fontSize[18],
        color: colors.text.tertiary,
        fontWeight: fontWeight.bold,
    },
    overlay: {
        justifyContent: 'center',
        alignItems: 'center',
    },
}));

export default React.memo(SetRow, (prevProps, nextProps) => {
    const prevFocused = prevProps.focusedInputData;
    const nextFocused = nextProps.focusedInputData;

    const prevThisRowFocused = prevFocused?.exerciseIndex === prevProps.exerciseIndex &&
                             prevFocused?.index === prevProps.setIndex;
    const nextThisRowFocused = nextFocused?.exerciseIndex === nextProps.exerciseIndex &&
                             nextFocused?.index === nextProps.setIndex;

    if (prevThisRowFocused !== nextThisRowFocused) return false;
    if (nextThisRowFocused && prevFocused?.type !== nextFocused?.type) return false;

    if (
        prevProps.setData?.weight !== nextProps.setData?.weight ||
        prevProps.setData?.reps !== nextProps.setData?.reps ||
        prevProps.setData?.isValidated !== nextProps.setData?.isValidated
    ) return false;
    if (prevProps.previousSetData !== nextProps.previousSetData) return false;
    if (prevProps.totalSetsInExercise !== nextProps.totalSetsInExercise) return false;

    return true;
});