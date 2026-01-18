import React, { useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    runOnJS,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { workoutService } from '../../services/WorkoutService';
import PreviousSetDisplay from './PreviousSetDisplay';
import { COLORS } from './ExerciseInputStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const SWIPE_THRESHOLD = -80;
const SPRING_CONFIG = { damping: 25, stiffness: 400, mass: 0.5 };

const NumericInput = memo(({ type, value, placeholder, isFocused, isValidated, isModified, onPress, style, textStyle }) => {
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
        value && !isFocused && !isModified && isValidated && textStyle.neuralInputTextFilled
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
                            onPress: () => {
                                workoutService.deleteSet(exerciseIndex, setIndex);
                            }
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
                            onPress: () => {
                                workoutService.deleteSet(exerciseIndex, setIndex);
                            }
                        }
                    ]
                );
            } else {
                workoutService.deleteSet(exerciseIndex, setIndex);
            }
        };
        
        handleDelete();
    }, [exerciseIndex, setIndex, setData.isValidated, totalSetsInExercise, translateX, deleteProgress]);

    const panGesture = useMemo(() => 
        Gesture.Pan()
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
            }),
        [translateX, deleteProgress, confirmDelete, hasTriggeredHaptic]
    );

    const animatedRowStyle = useAnimatedStyle(() => {
        'worklet';
        const progress = deleteProgress.value;
        const scale = 1 - (progress * 0.015);
        
        return {
            transform: [
                { translateX: translateX.value },
                { scale }
            ],
        };
    }, []);

    const animatedCheckStyle = useAnimatedStyle(() => {
        'worklet';
        const progress = deleteProgress.value;
        const scale = 1 + (progress * 0.12);
        const rotate = progress * 90;
        
        return {
            transform: [
                { scale },
                { rotate: `${rotate}deg` }
            ],
            backgroundColor: progress > 0.5
                ? `rgba(255, 69, 58, ${0.15 + progress * 0.85})`
                : setData.isValidated 
                    ? 'rgba(6, 182, 212, 0.15)' 
                    : COLORS.surfaceLight,
            borderColor: progress > 0.5
                ? `rgba(255, 69, 58, ${0.5 + progress * 0.5})`
                : setData.isValidated
                    ? 'rgba(6, 182, 212, 0.5)'
                    : COLORS.inputBorder,
        };
    }, [setData.isValidated]);

    const animatedTrashStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: deleteProgress.value,
        };
    }, []);

    const animatedCheckmarkStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: 1 - deleteProgress.value,
        };
    }, []);

    const handleValidationPress = useCallback(() => {
        try {
            const currentSet = setData;
            const reps = String(currentSet.reps || '').trim();
            const weight = String(currentSet.weight || '').trim();
            
            if (!currentSet.isValidated && (!reps || !weight)) {
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
                            setData.isValidated && stylesLocal.setNumberTextCompleted
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
                            type="weight"
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
                            type="reps"
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
                            <Animated.View style={[stylesLocal.quantumCheck, animatedCheckStyle]}>
                                {setData.isValidated && (
                                    <Animated.View style={animatedCheckmarkStyle}>
                                        <Text style={stylesLocal.quantumCheckText}>✓</Text>
                                    </Animated.View>
                                )}
                                <Animated.View style={[StyleSheet.absoluteFill, { 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                }, animatedTrashStyle]}>
                                    <MaterialCommunityIcons 
                                        name="trash-can-outline" 
                                        size={normalize(18)} 
                                        color="#fff" 
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

const stylesLocal = StyleSheet.create({
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(10),
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        minHeight: normalize(60),
    },
    completedRow: {
        backgroundColor: 'rgba(6, 182, 212, 0.03)',
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(6, 182, 212, 0.35)',
        paddingLeft: normalize(14),
    },
    setColumn: {
        width: normalize(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberText: {
        textAlign: 'center', 
        color: '#9ca3af',
        fontSize: normalize(15),
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    setNumberTextCompleted: {
        color: 'rgba(6, 182, 212, 0.7)',
    },
    prevColumn: {
        width: normalize(90),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: normalize(8),
    },
    inputWrapper: {
        width: normalize(90),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: normalize(8),
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
        backgroundColor: COLORS.inputBg,
        borderWidth: 2,
        borderColor: COLORS.inputBorder,
        borderRadius: normalize(12),
        paddingHorizontal: normalize(8),
        height: normalize(44),
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    neuralInputText: {
        color: '#6B7280',
        fontSize: normalize(15),
        fontWeight: '600',
        textAlign: 'center', 
        lineHeight: normalize(15),
        letterSpacing: 0.2,
    },
    neuralInputTextFilled: {
        color: '#9ca3af',
    },
    neuralInputTextPlaceholder: {
        color: '#6b7280',
        opacity: 0.6,
        fontWeight: '500',
        fontSize: normalize(12),
        lineHeight: normalize(20),
    },
    neuralInputTextPlaceholderFocused: {
        opacity: 0.8,
        color: '#FF9500',
    },
    neuralInputTextFocused: {
        color: '#FF9500',
    },
    neuralInputFocused: {
        borderColor: 'rgba(255, 149, 0, 0.5)',
        borderWidth: 2,
        backgroundColor: 'rgba(255, 149, 0, 0.08)',
    },
    neuralInputCompleted: {
        borderColor: 'rgba(6, 182, 212, 0.35)',
        backgroundColor: 'rgba(6, 182, 212, 0.06)',
    },
    quantumCheck: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(14),
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantumCheckText: {
        fontSize: normalize(18),
        color: "#9ca3af",
        fontWeight: '700',
    },
});

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