import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const ExerciseHeader = React.memo(({
    exercise,
    navigation,
    onMenuPress,
}) => {
    return (
        <View style={styles.exerciseHeaderWrapper}>
            <View style={styles.exerciseHeader}>
                <View style={styles.exerciseHeaderContent}>
                    <View style={styles.exerciseImageContainer}>
                        {exercise.imageURL ? (
                            <Image
                                source={{ uri: exercise.imageURL }}
                                style={styles.exerciseImage}
                            />
                        ) : (
                            <Ionicons
                                name="barbell-outline"
                                size={styles.iconSize.width}
                                color={colors.text.quaternary}
                            />
                        )}
                    </View>
                    <View style={styles.exerciseInfoContainer}>
                        <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                            {exercise.exerciseName}
                        </Text>
                        <View style={styles.exerciseMetadata}>
                            <Text style={styles.exerciseMetaText} numberOfLines={1}>
                                {exercise.muscleGroup || 'General'}
                            </Text>
                            {exercise.exerciseType && (
                                <>
                                    <View style={styles.metaDivider} />
                                    <Text style={styles.exerciseMetaText} numberOfLines={1}>
                                        {exercise.exerciseType}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ExerciseHistory', { exerciseName: exercise.exerciseName })}
                        style={styles.historyButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="time-outline"
                            size={styles.iconSizeSm.width}
                            color={colors.accent.cyan}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onMenuPress}
                        style={styles.menuButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="ellipsis-vertical"
                            size={styles.iconSizeSm.width}
                            color={colors.text.secondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.exercise.exerciseName === nextProps.exercise.exerciseName &&
        prevProps.exercise.imageURL === nextProps.exercise.imageURL &&
        prevProps.exercise.muscleGroup === nextProps.exercise.muscleGroup &&
        prevProps.exercise.exerciseType === nextProps.exercise.exerciseType &&
        prevProps.onMenuPress === nextProps.onMenuPress
    );
});

const styles = createStyles(() => ({
    exerciseHeaderWrapper: {
        position: 'relative',
    },
    exerciseHeader: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exerciseHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    exerciseImageContainer: {
        width: spacing[11],
        height: spacing[11],
        borderRadius: radius[3],
        backgroundColor: colors.faded.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
        marginRight: spacing[3],
        flexShrink: 0,
    },
    exerciseImage: {
        width: spacing[9],
        height: spacing[9],
        borderRadius: radius[2],
    },
    exerciseInfoContainer: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
        marginRight: spacing[2],
    },
    exerciseName: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: 0.2,
        lineHeight: 20,
        marginBottom: spacing[1],
    },
    exerciseMetadata: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },
    exerciseMetaText: {
        fontSize: fontSize[12],
        color: colors.text.quaternary,
        fontWeight: fontWeight.medium,
        flexShrink: 1,
    },
    metaDivider: {
        width: spacing[1],
        height: spacing[1],
        borderRadius: radius[1],
        backgroundColor: colors.text.quaternary,
        marginHorizontal: spacing[1],
        opacity: 0.6,
        flexShrink: 0,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        flexShrink: 0,
    },
    historyButton: {
        width: spacing[9],
        height: spacing[9],
        borderRadius: radius[2],
        backgroundColor: colors.faded.cyanDark,
        borderWidth: 1,
        borderColor: colors.border.cyan,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuButton: {
        width: spacing[9],
        height: spacing[9],
        borderRadius: radius[2],
        backgroundColor: colors.faded.surface,
        borderWidth: 1,
        borderColor: colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSize: {
        width: spacing[6],
        height: spacing[6],
    },
    iconSizeSm: {
        width: spacing.icon,
        height: spacing.icon,
    },
}));

ExerciseHeader.whyDidYouRender = true;
export default ExerciseHeader;