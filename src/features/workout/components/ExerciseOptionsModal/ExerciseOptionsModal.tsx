import { useEffect, type ComponentProps } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { normalize } from '../../../../shared/hooks/useResponsive';

type OptionRowProps = {
    icon: ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
    danger?: boolean;
};

type MoveButtonProps = {
    icon: ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    disabled?: boolean;
    label: string;
};

type ExerciseOptionsModalProps = {
    visible: boolean;
    onClose: () => void;
    exerciseName: string;
    position?: number;
    count?: number;
    onReplace: () => void;
    onDelete: () => void;
    onAddNote: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
};

const OptionRow = ({ icon, label, onPress, danger = false }: OptionRowProps) => (
    <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.65}>
        <View style={[styles.iconWrap, { backgroundColor: danger ? colors.faded.error : colors.faded.surface }]}>
            <Ionicons
                name={icon}
                size={normalize(16)}
                color={danger ? colors.accent.error : colors.text.secondary}
            />
        </View>
        <Text style={[styles.optionLabel, danger && styles.optionLabelDanger]}>{label}</Text>
    </TouchableOpacity>
);

const MoveButton = ({ icon, onPress, disabled, label }: MoveButtonProps) => (
    <TouchableOpacity
        style={[styles.moveButton, disabled && styles.moveButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.65}
        hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
        accessibilityLabel={label}
    >
        <Ionicons
            name={icon}
            size={normalize(16)}
            color={disabled ? colors.text.quaternary : colors.text.primary}
        />
    </TouchableOpacity>
);

const ExerciseOptionsModal = ({
    visible,
    onClose,
    exerciseName,
    position = 1,
    count = 1,
    onReplace,
    onDelete,
    onAddNote,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
}: ExerciseOptionsModalProps) => {
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

    const handleAction = (callback: () => void) => {
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
                        {count > 1 && (
                            <Text style={styles.subtitle}>
                                Exercise {position} of {count}
                            </Text>
                        )}

                        <OptionRow
                            icon="create-outline"
                            label="Add Note"
                            onPress={() => handleAction(onAddNote)}
                        />
                        <View style={styles.divider} />
                        <OptionRow
                            icon="swap-horizontal-outline"
                            label="Replace Exercise"
                            onPress={() => handleAction(onReplace)}
                        />

                        {count > 1 && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.option}>
                                    <View style={[styles.iconWrap, { backgroundColor: colors.faded.surface }]}>
                                        <Ionicons
                                            name="swap-vertical-outline"
                                            size={normalize(16)}
                                            color={colors.text.secondary}
                                        />
                                    </View>
                                    <Text style={[styles.optionLabel, styles.moveTitle]}>Reorder</Text>
                                    <MoveButton
                                        icon="arrow-up-outline"
                                        label="Move up"
                                        onPress={onMoveUp}
                                        disabled={!canMoveUp}
                                    />
                                    <MoveButton
                                        icon="arrow-down-outline"
                                        label="Move down"
                                        onPress={onMoveDown}
                                        disabled={!canMoveDown}
                                    />
                                </View>
                            </>
                        )}

                        <View style={styles.sectionDivider} />
                        <OptionRow
                            icon="trash-outline"
                            label="Delete Exercise"
                            onPress={() => handleAction(onDelete)}
                            danger
                        />
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
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.tertiary,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        paddingHorizontal: spacing[1],
    },
    subtitle: {
        fontSize: fontSize[12],
        color: colors.text.quaternary,
        paddingHorizontal: spacing[1],
        marginTop: spacing[1],
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
        fontSize: fontSize[16],
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
    moveTitle: {
        flex: 1,
    },
    moveButton: {
        width: spacing[9],
        height: spacing[9],
        borderRadius: radius[3],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.faded.surface,
    },
    moveButtonDisabled: {
        opacity: 0.4,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: colors.border.light,
    },
});

export default ExerciseOptionsModal;
