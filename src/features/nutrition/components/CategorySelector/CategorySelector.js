import { useRef, useCallback, useEffect, memo } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const CategorySelector = memo(({ selectedCategory, setSelectedCategory, loading }) => {
    const categories = ['Frequent', 'Recent', 'Favorites'];
    const scaleAnims = useRef(categories.map(() => new Animated.Value(1))).current;
    const skeletonOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(skeletonOpacity, {
                        toValue: 0.6,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(skeletonOpacity, {
                        toValue: 0.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            skeletonOpacity.stopAnimation();
        }
        return () => skeletonOpacity.stopAnimation();
    }, [loading]);

    const handlePressIn = useCallback((index) => {
        Animated.spring(scaleAnims[index], {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 500,
            friction: 10,
        }).start();
    }, [scaleAnims]);

    const handlePressOut = useCallback((index) => {
        Animated.spring(scaleAnims[index], {
            toValue: 1,
            useNativeDriver: true,
            tension: 500,
            friction: 10,
        }).start();
    }, [scaleAnims]);

    const handlePress = useCallback((category, index) => {
        if (selectedCategory !== category) {
            setSelectedCategory(category);
        }
        handlePressOut(index);
    }, [selectedCategory, setSelectedCategory, handlePressOut]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.pillContainer}>
                    {categories.map((_, index) => (
                        <Animated.View
                            key={index}
                            style={[styles.skeletonPill, { opacity: skeletonOpacity }]}
                        />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.pillContainer}>
                {categories.map((category, index) => {
                    const isSelected = selectedCategory === category;
                    return (
                        <Animated.View
                            key={category}
                            style={{ transform: [{ scale: scaleAnims[index] }] }}
                        >
                            <TouchableOpacity
                                onPress={() => handlePress(category, index)}
                                onPressIn={() => handlePressIn(index)}
                                onPressOut={() => handlePressOut(index)}
                                activeOpacity={0.9}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <View style={[
                                    styles.pill,
                                    isSelected ? styles.pillSelected : styles.pillInactive,
                                ]}>
                                    <Text style={[
                                        styles.pillText,
                                        isSelected ? styles.selectedPillText : styles.inactivePillText,
                                    ]}>
                                        {category}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
});

const styles = createStyles(() => ({
    container: {
        marginTop: 10,
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-start',
    },
    pill: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillSelected: {
        backgroundColor: colors.accent.primary,
        borderColor: 'transparent',
    },
    pillInactive: {
        backgroundColor: 'transparent',
        borderColor: colors.border.default,
    },
    pillText: {
        fontSize: 14,
        fontWeight: fontWeight.medium,
        letterSpacing: 0.2,
    },
    selectedPillText: {
        color: colors.accent.buttonText,
        fontWeight: fontWeight.semibold,
    },
    inactivePillText: {
        color: colors.text.secondary,
    },
    skeletonPill: {
        backgroundColor: colors.background.tertiary,
        borderRadius: 12,
        height: 40,
        width: 90,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
}));

export default CategorySelector;