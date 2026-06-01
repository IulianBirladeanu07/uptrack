import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { colors } from '../../../../../shared/theme';
import styles from '../WorkoutLibraryScreenStyle';

const DELETE_BUTTON_WIDTH = normalize(90);
const SPRING_CONFIG = {
    damping: 20,
    stiffness: 300,
    mass: 0.3,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};
const TIMING_CONFIG = { duration: 250 };

const TemplateItem = React.memo(({ item, expandedCards, onToggleExpanded, onEdit, onStart, onDelete, formatDate }) => {
    const template = item.data || item;
    const templateId = template.id || item.id;
    const exerciseCount = template.exerciseCount || (template.exercises?.length || 0);
    const duration = template.duration || 'N/A';
    const exercises = template.exercises || [];
    const isExpanded = expandedCards[templateId];
    const displayExercises = isExpanded ? exercises : exercises.slice(0, 3);
    const hasMoreExercises = exercises.length > 3;

    const translateX = useSharedValue(0);
    const deleteOpacity = useSharedValue(0);
    const deleteScale = useSharedValue(0.85);

    const gesture = Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-6, 6])
        .onUpdate((event) => {
            const dragX = Math.min(0, event.translationX);
            const maxSwipe = DELETE_BUTTON_WIDTH * 1.1;
            const clampedX = Math.max(dragX, -maxSwipe);

            if (Math.abs(clampedX) > DELETE_BUTTON_WIDTH) {
                const overswipe = Math.abs(clampedX) - DELETE_BUTTON_WIDTH;
                const resistance = 1 - (overswipe / (maxSwipe - DELETE_BUTTON_WIDTH)) * 0.5;
                translateX.value = -DELETE_BUTTON_WIDTH - (overswipe * resistance);
            } else {
                translateX.value = clampedX;
            }

            const progress = Math.abs(translateX.value) / DELETE_BUTTON_WIDTH;
            deleteOpacity.value = interpolate(progress, [0, 0.3, 1], [0, 0.6, 1], Extrapolation.CLAMP);
            deleteScale.value = interpolate(progress, [0, 0.3, 0.7, 1], [0.75, 0.9, 0.98, 1], Extrapolation.CLAMP);
        })
        .onEnd((event) => {
            const shouldOpen = event.translationX < -DELETE_BUTTON_WIDTH * 0.35 || event.velocityX < -800;

            if (shouldOpen) {
                translateX.value = withSpring(-DELETE_BUTTON_WIDTH, SPRING_CONFIG);
                deleteOpacity.value = withSpring(1, SPRING_CONFIG);
                deleteScale.value = withSpring(1, SPRING_CONFIG);
            } else {
                translateX.value = withSpring(0, SPRING_CONFIG);
                deleteOpacity.value = withSpring(0, SPRING_CONFIG);
                deleteScale.value = withSpring(0.75, SPRING_CONFIG);
            }
        });

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const deleteButtonStyle = useAnimatedStyle(() => ({
        opacity: deleteOpacity.value,
        transform: [{ scale: deleteScale.value }],
    }));

    const handleDelete = useCallback(() => {
        translateX.value = withTiming(-500, TIMING_CONFIG);
        setTimeout(() => onDelete(item), 200);
    }, [item, onDelete, translateX]);

    const renderExerciseItem = useCallback(({ item, index }) => {
        const exerciseName = item.exerciseName || item.name || 'Exercise';
        const muscleGroup = item.muscleGroup || 'N/A';
        const imageURL = item.imageURL;
        const isLastItem = index === displayExercises.length - 1 || (!isExpanded && index === 2);

        return (
            <View style={[styles.exerciseItem, isLastItem && styles.exerciseItemLast]}>
                <View style={styles.exerciseImageContainer}>
                    {imageURL ? (
                        <Image source={{ uri: imageURL }} style={styles.exerciseImage} resizeMode="cover" />
                    ) : (
                        <Ionicons name="barbell-outline" size={normalize(20)} color={colors.text.secondary} />
                    )}
                </View>
                <View style={styles.exerciseDetails}>
                    <View style={styles.exerciseInfoContainer}>
                        <Text style={styles.exerciseName} numberOfLines={1}>{exerciseName}</Text>
                        <Text style={styles.exerciseMuscleGroup}>{muscleGroup}</Text>
                    </View>
                    <Text style={styles.setReps}>
                        {item.numSets && item.repRange ? `${item.numSets} x ${item.repRange}` : '4 × 6-10'}
                    </Text>
                </View>
            </View>
        );
    }, [displayExercises.length, isExpanded]);

    return (
        <View style={styles.swipeContainer}>
            <Animated.View style={[styles.deleteButtonBehind, deleteButtonStyle]}>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButtonTouch} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={normalize(28)} color={colors.text.primary} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </Animated.View>

            <GestureDetector gesture={gesture}>
                <Animated.View style={containerStyle}>
                    <View style={styles.workoutCard}>
                        <View style={styles.workoutHeader}>
                            <View style={styles.workoutHeaderLeft}>
                                <Text style={styles.workoutTitle}>{template.templateName || 'Workout Template'}</Text>
                                <View style={styles.workoutMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={normalize(14)} color={colors.text.secondary} />
                                        <Text style={styles.metaItemText}>{duration} min</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="barbell-outline" size={normalize(14)} color={colors.text.secondary} />
                                        <Text style={styles.metaItemText}>{exerciseCount} exercises</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.categoryTagContainer}>
                                <Text style={styles.categoryTag}>{formatDate(template.createdAt)}</Text>
                            </View>
                        </View>

                        {exercises.length > 0 && (
                            <View style={styles.exerciseList}>
                                <FlatList
                                    data={displayExercises}
                                    renderItem={renderExerciseItem}
                                    keyExtractor={(item, index) => `exercise-${templateId}-${index}`}
                                    scrollEnabled={false}
                                    removeClippedSubviews={true}
                                    initialNumToRender={3}
                                    maxToRenderPerBatch={3}
                                    windowSize={3}
                                    getItemLayout={(data, index) => ({
                                        length: normalize(60),
                                        offset: normalize(60) * index,
                                        index,
                                    })}
                                />
                                {hasMoreExercises && (
                                    <TouchableOpacity
                                        style={styles.showMore}
                                        onPress={() => onToggleExpanded(templateId)}
                                    >
                                        <Text style={styles.showMoreText}>
                                            {isExpanded ? 'Show less exercises ↑' : `Show ${exercises.length - 3} more exercises ↓`}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={styles.workoutActions}>
                            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(template)}>
                                <Ionicons name="create-outline" size={normalize(18)} color={colors.text.secondary} />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.startButton} onPress={() => onStart(template)}>
                                <Ionicons name="play" size={normalize(20)} color={colors.accent.buttonText} />
                                <Text style={styles.startButtonText}>Start Workout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
});

TemplateItem.whyDidYouRender = true;
export default TemplateItem;