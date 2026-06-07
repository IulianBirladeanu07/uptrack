import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { normalize } from '../../../../shared/hooks/useResponsive';

const ExerciseOptionsModal = ({
    visible,
    onClose,
    exerciseName,
    onReplace,
    onDelete,
    onAddNote,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(300);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: 150 });
            translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
        } else {
            backdropOpacity.value = withTiming(0, { duration: 140 });
            translateY.value = withTiming(300, { duration: 180, easing: Easing.in(Easing.cubic) });
        }
    }, [visible]);

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const handleAction = (callback) => {
        backdropOpacity.value = withTiming(0, { duration: 140 });
        translateY.value = withTiming(300, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
            if (finished) {
                runOnJS(onClose)();
                runOnJS(callback)();
            }
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.overlayBase} onPress={onClose}>
                <Animated.View
                    style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
                    pointerEvents="none"
                />
                <Pressable>
                    <Animated.View
                        style={[
                            styles.sheet,
                            { paddingBottom: Math.max(insets.bottom, spacing[4]) },
                            sheetStyle,
                        ]}
                    >
                        <View style={styles.handle} />

                        <Text style={styles.title} numberOfLines={1}>
                            {exerciseName}
                        </Text>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleAction(onReplace)}
                            activeOpacity={0.65}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: colors.faded.primary }]}>
                                <Ionicons name="swap-horizontal-outline" size={normalize(16)} color={colors.accent.primary} />
                            </View>
                            <Text style={styles.optionLabel}>Replace Exercise</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleAction(onAddNote)}
                            activeOpacity={0.65}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: colors.faded.cyanDark }]}>
                                <Ionicons name="create-outline" size={normalize(16)} color={colors.accent.cyan} />
                            </View>
                            <Text style={styles.optionLabel}>Add Note</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleAction(onDelete)}
                            activeOpacity={0.65}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: colors.faded.error }]}>
                                <Ionicons name="trash-outline" size={normalize(16)} color={colors.accent.error} />
                            </View>
                            <Text style={[styles.optionLabel, styles.optionLabelDanger]}>Delete Exercise</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayBase: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: radius[5],
        borderTopRightRadius: radius[5],
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border.default,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
    },
    handle: {
        width: 32,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.faded.surfaceMedium,
        alignSelf: 'center',
        marginBottom: spacing[3],
    },
    title: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: 0.2,
        marginBottom: spacing[1],
        paddingHorizontal: spacing[1],
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        gap: spacing[3],
    },
    iconWrap: {
        width: spacing[8],
        height: spacing[8],
        borderRadius: radius[3],
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    optionLabelDanger: {
        color: colors.accent.error,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginLeft: spacing[11],
    },
});

export default ExerciseOptionsModal;