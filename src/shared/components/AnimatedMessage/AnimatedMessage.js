import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../theme';
import { createStyles } from '../../theme/createStyles';
import { normalize } from '../../hooks/useResponsive';

const AnimatedMessage = ({ message }) => {
    const insets = useSafeAreaInsets();
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });

        const timer = setTimeout(() => {
            opacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
        }, 2300);

        return () => clearTimeout(timer);
    }, [message]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, { top: insets.top + normalize(24) }, animatedStyle]}>
            <Ionicons name="alert-circle-outline" size={spacing.icon} color={colors.accent.primary} />
            <Text style={styles.text} numberOfLines={1}>{message}</Text>
        </Animated.View>
    );
};

const styles = createStyles(() => ({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.background.secondary,
        // paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.primary,
        zIndex: 9999,
        height: normalize(54),
    },
    text: {
        color: colors.text.primary,
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        letterSpacing: 0.1,
        flexShrink: 1,
    },
}));

export default AnimatedMessage;