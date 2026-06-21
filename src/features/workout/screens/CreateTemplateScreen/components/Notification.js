import { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    alertContainer: {
        position: 'absolute',
        bottom: spacing[24],
        alignSelf: 'center',
        width: '90%',
        borderRadius: radius[3],
        borderWidth: 1,
        padding: spacing[4],
        zIndex: 100,
        backgroundColor: colors.background.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    alertContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: spacing[3],
    },
    alertText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        lineHeight: 20,
        flex: 1,
        marginRight: spacing[3],
    },
    alertActionButton: {
        borderRadius: radius[2],
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        backgroundColor: colors.accent.primary,
    },
    alertActionText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
        color: colors.accent.buttonText,
        textTransform: 'uppercase',
    },
}));

const Notification = ({ message, isError, action, visible, onDismiss }) => {
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();

            const timeout = setTimeout(() => onDismiss(), 4000);
            return () => clearTimeout(timeout);
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, onDismiss, translateY, opacity]);

    const handleActionPress = useCallback(() => {
        if (action?.onPress) action.onPress();
        onDismiss();
    }, [action, onDismiss]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.alertContainer,
                {
                    transform: [{ translateY }],
                    opacity,
                    borderColor: isError ? colors.accent.error : colors.border.primary,
                },
            ]}
        >
            <View style={styles.alertContent}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={isError ? 'alert-circle' : 'check-circle'}
                        size={spacing.iconMd}
                        color={isError ? colors.accent.error : colors.accent.successAlt}
                    />
                </View>
                <Text style={[styles.alertText, isError && { color: colors.accent.error }]}>
                    {message}
                </Text>
                {action && (
                    <TouchableOpacity
                        style={[styles.alertActionButton, isError && { backgroundColor: colors.accent.error }]}
                        activeOpacity={0.7}
                        onPress={handleActionPress}
                    >
                        <Text style={styles.alertActionText}>{action.text}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

export default Notification;