import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { colors } from '../../../../../shared/theme';
import styles from '../WorkoutLibraryScreenStyle';

const LoadingSpinner = React.memo(({ type }) => {
    const spinValue = new Animated.Value(0);
    const scaleValue = new Animated.Value(0.8);
    const opacityValue = new Animated.Value(0.3);

    useEffect(() => {
        const spinAnimation = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
        );

        const scaleAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(scaleValue, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
            ]),
        );

        const opacityAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacityValue, { toValue: 1, duration: 1500, useNativeDriver: true }),
                Animated.timing(opacityValue, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
            ]),
        );

        spinAnimation.start();
        scaleAnimation.start();
        opacityAnimation.start();

        return () => {
            spinAnimation.stop();
            scaleAnimation.stop();
            opacityAnimation.stop();
        };
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.loadingContainer}>
            <Animated.View
                style={{
                    transform: [{ rotate: spin }, { scale: scaleValue }],
                    marginBottom: normalize(20),
                }}
            >
                <MaterialCommunityIcons
                    name={type === 'Splits' ? 'calendar-week' : 'dumbbell'}
                    size={normalize(48)}
                    color={colors.accent.primary}
                />
            </Animated.View>
            <Animated.Text
                style={[styles.loadingText, { opacity: opacityValue }]}
            >
                Loading your {type.toLowerCase()}...
            </Animated.Text>
        </View>
    );
});

export default LoadingSpinner;