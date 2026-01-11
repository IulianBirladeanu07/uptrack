import React, { useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { workoutService } from '../../services/WorkoutService';
import PreviousSetDisplay from './PreviousSetDisplay';
import { COLORS } from './ExerciseInputStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const NumericInput = memo(({ type, value, placeholder, isFocused, isValidated, onPress, style, textStyle }) => {
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
        value && isFocused && textStyle.neuralInputTextFocused
    ], [value, isFocused, textStyle]);

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
    fadeAnim = [],
    exercise,
    onKeyboardChange,
    openAnimatedMessage,
    focusedInputData,
}) => {
    const animRefs = useRef({
        swipe: new Animated.Value(0),
        press: new Animated.Value(1),
    }).current;
    
    const lastPressTime = useRef(0);

    const isThisRowFocused = focusedInputData?.exerciseIndex === exerciseIndex && 
                            focusedInputData?.index === setIndex;
    
    const isWeightFocused = isThisRowFocused && focusedInputData?.type === 'weight';
    const isRepsFocused = isThisRowFocused && focusedInputData?.type === 'reps';

    const panGesture = useMemo(() => 
        Gesture.Pan()
            .activeOffsetX([-10, 10])
            .failOffsetY([-10, 10])
            .onChange((e) => {
                animRefs.swipe.setValue(e.translationX);
            })
            .onEnd((e) => {
                if (e.translationX < -80) {
                    workoutService.deleteSet(exerciseIndex, setIndex);
                    animRefs.swipe.setValue(0);
                } else if (Math.abs(e.translationX) > 10) {
                    Animated.spring(animRefs.swipe, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 60,
                        friction: 10
                    }).start();
                }
            }),
        [exerciseIndex, setIndex, animRefs.swipe]
    );

    const animatedStyles = useMemo(() => ({
        row: {
            transform: [{
                translateX: animRefs.swipe.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [-100, 0],
                    extrapolate: 'clamp',
                })
            }]
        },
        deleteButton: {
            ...stylesLocal.deleteButton,
            opacity: animRefs.swipe.interpolate({
                inputRange: [-100, -30, -20],
                outputRange: [1, 1, 0],
                extrapolate: 'clamp',
            }),
            transform: [{
                translateX: animRefs.swipe.interpolate({
                    inputRange: [-100, -20, 0],
                    outputRange: [0, 80, 100],
                    extrapolate: 'clamp',
                }),
            }],
        }
    }), [animRefs.swipe]);

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

    const handleValidationPressIn = useCallback(() => {
        Animated.spring(animRefs.press, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 200,
            friction: 10,
        }).start();
    }, [animRefs.press]);

    const handleValidationPressOut = useCallback(() => {
        Animated.spring(animRefs.press, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 10,
        }).start();
    }, [animRefs.press]);

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
    }), []);

    return (
        <View style={stylesLocal.swipeableContainer}>
            <Animated.View style={animatedStyles.deleteButton}>
                <Text style={stylesLocal.deleteButtonText}>Delete</Text>
            </Animated.View>
            <GestureDetector gesture={panGesture}>
                <Animated.View 
                    style={[
                        animatedStyles.row, 
                        { opacity: fadeAnim?.[setIndex] ?? 1 }
                    ]}
                >
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
                                onPress={() => handleInputPress('reps')}
                                style={inputStyles}
                                textStyle={inputTextStyles}
                            />
                        </View>
                        
                        <View style={stylesLocal.statusColumn}>
                            <Animated.View style={{ transform: [{ scale: animRefs.press }] }}>
                                <TouchableOpacity
                                    style={[
                                        stylesLocal.quantumCheck,
                                        setData.isValidated && stylesLocal.quantumCheckCompleted
                                    ]}
                                    onPress={handleValidationPress}
                                    onPressIn={handleValidationPressIn}
                                    onPressOut={handleValidationPressOut}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                                >
                                    {setData.isValidated && (
                                        <Text style={stylesLocal.quantumCheckText}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const stylesLocal = StyleSheet.create({
    swipeableContainer: {
        backgroundColor: 'transparent',
        position: 'relative',
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(10),
        backgroundColor: 'transparent',
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
        color: '#d1d5db',
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
        color: '#d1d5db',
        fontSize: normalize(15),
        fontWeight: '600',
        textAlign: 'center', 
        lineHeight: normalize(15),
        letterSpacing: 0.2,
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
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 2,
        borderColor: COLORS.inputBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantumCheckCompleted: {
        borderColor: 'rgba(6, 182, 212, 0.5)',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        shadowColor: 'rgba(6, 182, 212, 0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    quantumCheckText: {
        fontSize: normalize(18),
        color: "#9ca3af",
        fontWeight: '700',
    },
    deleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: normalize(80),
        backgroundColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: normalize(8),
    },
    deleteButtonText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: normalize(13),
        letterSpacing: 0.3,
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
    
    return true;
});