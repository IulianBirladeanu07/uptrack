import { useEffect, memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing[2],
        paddingVertical: spacing[2],
        marginHorizontal: spacing[6],
        position: 'relative',
    },
    progressStep: {
        alignItems: 'center',
        flex: 1,
        zIndex: 2,
        position: 'relative',
    },
    indicatorWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: spacing[9],
        height: spacing[9],
        marginBottom: spacing[1],
    },
    stepIndicator: {
        width: spacing[9],
        height: spacing[9],
        borderRadius: radius[5],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderColor: colors.border.default,
        zIndex: 3,
    },
    activeStepIndicator: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
        borderWidth: 2,
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    completedStepIndicator: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    stepLabel: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
        textAlign: 'center',
        lineHeight: 16,
    },
    activeStepLabel: {
        color: colors.text.primary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize[12],
    },
    completedStepLabel: {
        color: colors.text.secondary,
        fontWeight: fontWeight.medium,
    },
    activeUnderline: {
        marginTop: 2,
        height: 2,
        width: spacing[6],
        backgroundColor: colors.accent.primary,
        borderRadius: 1,
        alignSelf: 'center',
    },
    progressLineContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: spacing[9],
        height: 2,
        zIndex: 1,
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: colors.faded.surfaceMedium,
        borderRadius: 1,
    },
    progressLineActive: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 2,
        backgroundColor: colors.accent.primary,
        borderRadius: 1,
    },
}));

const ProgressStepItem = memo(({ step, index, currentStep, totalSteps }) => {
    const isCompleted = index < currentStep;
    const isActive = index === currentStep;

    const scale = useSharedValue(isCompleted ? 1.1 : isActive ? 1.2 : 1);

    useEffect(() => {
        scale.value = withSpring(isCompleted ? 1.1 : isActive ? 1.2 : 1, {
            damping: 15,
            stiffness: 200,
            mass: 0.4,
        });
    }, [currentStep, isActive, isCompleted, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.progressStep}>
            <View style={styles.indicatorWrapper}>
                <Animated.View
                    style={[
                        styles.stepIndicator,
                        isCompleted && styles.completedStepIndicator,
                        isActive && styles.activeStepIndicator,
                        animatedStyle,
                    ]}
                >
                    <Ionicons
                        name={isCompleted ? 'checkmark' : step.icon}
                        size={spacing.icon}
                        color={isCompleted || isActive ? colors.accent.buttonText : colors.text.secondary}
                    />
                </Animated.View>
            </View>
            <Text style={[styles.stepLabel, isCompleted && styles.completedStepLabel, isActive && styles.activeStepLabel]}>
                {step.title}
            </Text>
            {isActive && <View style={styles.activeUnderline} />}
        </View>
    );
});

export const ProgressSteps = ({ currentStep, steps }) => {
    const totalSteps = steps.length;
    const targetWidth = currentStep === 0 ? 15 : (currentStep / (totalSteps - 1)) * 100;
    const progressWidth = useSharedValue(targetWidth);

    useEffect(() => {
        progressWidth.value = withSpring(targetWidth, { damping: 12, stiffness: 100, mass: 0.6 });
    }, [currentStep, targetWidth, progressWidth]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressLineContainer}>
                <View style={styles.progressLine} />
                <Animated.View style={[styles.progressLineActive, animatedProgressStyle]} />
            </View>
            {steps.map((step, index) => (
                <ProgressStepItem
                    key={`${step.id || index}-${step.title}`}
                    step={step}
                    index={index}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                />
            ))}
        </View>
    );
};

export default ProgressSteps;