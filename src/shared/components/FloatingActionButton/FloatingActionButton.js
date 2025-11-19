import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Easing, Dimensions, Haptics } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { normalize } from '../../hooks/useResponsive';

const theme = {
    background: '#02111B',
    cardBackground: 'rgba(30, 41, 59, 0.4)',
    cardBackgroundDark: 'rgba(15, 23, 42, 0.8)',
    gradientOverlay: 'rgba(255, 133, 53, 0.05)',
    textPrimary: '#FFFFFF',
    textSecondary: '#d1d5db',
    textInactive: 'rgba(255, 255, 255, 0.4)',
    textMuted: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    borderDivider: 'rgba(255, 255, 255, 0.08)',
    accentPrimary: '#ff8535',
    accentSecondary: '#00d4ff',
    accentPurple: '#a855f7',
};

const { height } = Dimensions.get('window');

const FloatingActionButton = React.memo(({
    onStartWorkout,
    onQuickWorkout,
    onTemplates,
    onHistory,
    onTrainingSplits,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const animationValue = useRef(new Animated.Value(0)).current;

    const fabOptions = useMemo(() => [
        {
            id: 'quick-workout',
            icon: 'flash',
            iconSet: 'Ionicons',
            label: 'Quick Start',
            description: 'Start immediately',
            color: theme.accentPrimary,
            emoji: '⚡️',
            onPress: onQuickWorkout,
        },
        {
            id: 'templates',
            icon: 'clipboard-list-outline',
            iconSet: 'MaterialCommunityIcons',
            label: 'Templates',
            description: 'Saved workouts',
            color: theme.textSecondary,
            emoji: '📋',
            onPress: onTemplates,
        },
        {
            id: 'history',
            icon: 'stats-chart',
            iconSet: 'Ionicons',
            label: 'Analytics',
            description: 'View progress',
            color: theme.accentSecondary,
            emoji: '📈',
            onPress: onHistory,
        },
        {
            id: 'splits',
            icon: 'calendar-outline',
            iconSet: 'Ionicons',
            label: 'Programs',
            description: 'Training plans',
            color: theme.accentPurple,
            emoji: '🗓️',
            onPress: onTrainingSplits,
        },
    ], [onQuickWorkout, onTemplates, onHistory, onTrainingSplits]);

    const animatedStyles = useMemo(() => ({
        backdrop: {
            opacity: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.95],
            }),
        },
        menuContainer: {
            transform: [{
                translateY: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: 'clamp',
                })
            }],
        },
        fabRotation: {
            transform: [{
                rotate: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '135deg'],
                })
            }],
        },
    }), [animationValue]);

    const animateMenu = useCallback((toOpen) => {
        Animated.timing(animationValue, {
            toValue: toOpen ? 1 : 0,
            duration: 300,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
        }).start();
    }, [animationValue]);

    const toggleMenu = async () => {
        if (Haptics?.impactAsync) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        const newMenuOpen = !menuOpen;
        setMenuOpen(newMenuOpen);
        animateMenu(newMenuOpen);
    };

    const handleOptionPress = useCallback(async (callback, label) => {
        if (Haptics?.impactAsync) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setMenuOpen(false);
        animateMenu(false);
        setTimeout(() => {
            callback?.();
            console.log(`${label} pressed`);
        }, 150);
    }, [animateMenu]);

    const memoizedMenuItems = useMemo(() =>
        fabOptions.map((option, index) => {
            const IconComponent = option.iconSet === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

            const interpolatedStyle = {
                opacity: animationValue.interpolate({
                    inputRange: [0, 0.3 + (index * 0.15), 1],
                    outputRange: [0, 0, 1],
                    extrapolate: 'clamp',
                }),
                transform: [{
                    translateY: animationValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                        extrapolate: 'clamp',
                    })
                }]
            };

            const iconStyle = {
                backgroundColor: `${option.color}15`,
                borderColor: `${option.color}30`
            };

            return (
                <Animated.View
                    key={option.id}
                    style={[styles.menuItemWrapper, interpolatedStyle]}
                >
                    <TouchableOpacity
                        style={styles.menuOption}
                        onPress={() => handleOptionPress(option.onPress, option.label)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIcon, iconStyle]}>
                            <IconComponent name={option.icon} size={normalize(22)} color={option.color} />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuLabel}>{option.label}</Text>
                            <Text style={styles.menuSublabel}>{option.description}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            );
        }),
        [animationValue, handleOptionPress, fabOptions]
    );

    return (
        <>
            <Animated.View
                style={[
                    styles.backdrop,
                    animatedStyles.backdrop,
                    {
                        pointerEvents: menuOpen ? 'auto' : 'none',
                    },
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={toggleMenu}
                    activeOpacity={1}
                />
            </Animated.View>

            <TouchableOpacity
                style={styles.fab}
                onPress={toggleMenu}
                activeOpacity={0.9}
                accessibilityLabel={menuOpen ? "Close Menu" : "Open Workout Menu"}
            >
                <Animated.View style={animatedStyles.fabRotation}>
                    <MaterialCommunityIcons name="plus" size={normalize(28)} color={theme.textPrimary} />
                </Animated.View>
            </TouchableOpacity>

            <Animated.View
                style={[
                    styles.menuContainer,
                    animatedStyles.menuContainer,
                ]}
                pointerEvents={menuOpen ? 'auto' : 'none'}
            >
                <View style={styles.menuHandle} />
                {memoizedMenuItems}
            </Animated.View>
        </>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2, 17, 27, 0.95)',
        zIndex: 998,
    },
    fab: {
        position: 'absolute',
        bottom: normalize(30),
        right: normalize(30),
        width: normalize(68),
        height: normalize(68),
        backgroundColor: theme.accentPrimary,
        borderRadius: normalize(34),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        zIndex: 1001,
        shadowColor: theme.accentPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    menuContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30, 41, 59, 0.98)',
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
        paddingHorizontal: normalize(24),
        paddingBottom: normalize(24),
        paddingTop: normalize(12),
        zIndex: 1000,
        borderTopWidth: 1,
        borderTopColor: 'rgba(51, 65, 85, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    menuHandle: {
        width: normalize(40),
        height: normalize(4),
        backgroundColor: 'rgba(148, 163, 184, 0.4)',
        borderRadius: normalize(2),
        alignSelf: 'center',
        marginBottom: normalize(24),
    },
    menuItemWrapper: {
        marginBottom: normalize(8),
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        borderRadius: normalize(16),
        padding: normalize(16),
        gap: normalize(16),
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.4)',
    },
    menuIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: theme.textPrimary,
        marginBottom: normalize(4),
        letterSpacing: 0.2,
    },
    menuSublabel: {
        fontSize: normalize(14),
        color: theme.textSecondary,
        letterSpacing: 0.1,
    },
});

export default FloatingActionButton;