import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
    BackHandler,
    ActivityIndicator,
    LayoutChangeEvent,
} from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import styles from './WorkoutDetailsStyle';
import { colors, spacing } from '../../../../shared/theme';
import { findBestSet, formatBestSet } from '../../handlers/WorkoutHandler';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import { getWorkoutCardSummary } from './workoutCardSummary';
import { getWorkoutDetailsBackCount, getWorkoutDetailsEntryMode } from './workoutDetailsNavigation';
import { getWorkoutPhotoFrame, getWorkoutStorySize } from './workoutStoryLayout';
import {
    clampWorkoutStoryScale,
    clampWorkoutStoryTranslation,
    getWorkoutStoryFitScale,
    clampWorkoutPhotoScale,
    clampWorkoutPhotoTranslation,
    getNextWorkoutStoryStyleMode,
    getWorkoutStoryCenterAlignment,
    isWorkoutStoryCardAtPoint,
    type WorkoutStoryStyleMode,
} from './workoutStoryTransform';

const WorkoutDetails = () => {
    const navigation = useAppNavigation();
    const route = useAppRoute<'WorkoutDetails'>();
    const { duration, exercises: rawExercises, workoutName, notes } = route.params;
    const exercises = rawExercises ?? [];
    const navigationState = navigation.getState();
    const previousRouteName = navigationState.routes[navigationState.index - 1]?.name;
    const isJustCompleted = getWorkoutDetailsEntryMode(previousRouteName) === 'completion';
    const [isStoryEditor, setIsStoryEditor] = useState(!isJustCompleted);
    const [photo, setPhoto] = useState<{ uri: string; width: number; height: number } | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [storyStyleMode, setStoryStyleMode] = useState<WorkoutStoryStyleMode>('solid');
    const insets = useSafeAreaInsets();
    const [previewArea, setPreviewArea] = useState({ width: 0, height: 0 });
    const [storyContentSize, setStoryContentSize] = useState({ width: 0, height: 0 });
    const storySize = getWorkoutStorySize(previewArea.width, previewArea.height);
    const workoutCardRef = useRef<ViewShot>(null);
    const storyScale = useSharedValue(1);
    const savedStoryScale = useSharedValue(1);
    const storyTranslateX = useSharedValue(0);
    const storyTranslateY = useSharedValue(0);
    const savedStoryTranslateX = useSharedValue(0);
    const savedStoryTranslateY = useSharedValue(0);
    const hasUserTransformedStory = useSharedValue(false);
    const panTargetsCard = useSharedValue(true);
    const pinchTargetsCard = useSharedValue(true);
    const photoScale = useSharedValue(1);
    const savedPhotoScale = useSharedValue(1);
    const photoTranslateX = useSharedValue(0);
    const photoTranslateY = useSharedValue(0);
    const savedPhotoTranslateX = useSharedValue(0);
    const savedPhotoTranslateY = useSharedValue(0);
    const showVerticalGuide = useSharedValue(0);
    const showHorizontalGuide = useSharedValue(0);
    const photoFrame = photo
        ? getWorkoutPhotoFrame(photo.width, photo.height, storySize.width, storySize.height)
        : { width: storySize.width, height: storySize.height };
    const photoStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: photoTranslateX.value },
            { translateY: photoTranslateY.value },
            { scale: photoScale.value },
        ],
    }));
    const storyContentStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: storyTranslateX.value },
            { translateY: storyTranslateY.value },
            { scale: storyScale.value },
        ],
    }));
    const verticalGuideStyle = useAnimatedStyle(() => ({ opacity: showVerticalGuide.value }));
    const horizontalGuideStyle = useAnimatedStyle(() => ({ opacity: showHorizontalGuide.value }));
    const panGesture = useMemo(() => Gesture.Pan()
        .minDistance(2)
        .onBegin(event => {
            panTargetsCard.value = !photo || isWorkoutStoryCardAtPoint(
                event.x,
                event.y,
                storySize.width,
                storySize.height,
                storyContentSize.width,
                storyContentSize.height,
                storyTranslateX.value,
                storyTranslateY.value,
                storyScale.value,
            );
            savedStoryTranslateX.value = storyTranslateX.value;
            savedStoryTranslateY.value = storyTranslateY.value;
            savedPhotoTranslateX.value = photoTranslateX.value;
            savedPhotoTranslateY.value = photoTranslateY.value;
        })
        .onUpdate(event => {
            if (panTargetsCard.value) {
                hasUserTransformedStory.value = true;
                const horizontalAlignment = getWorkoutStoryCenterAlignment(
                    savedStoryTranslateX.value + event.translationX,
                    storySize.width / 2,
                    storySize.width,
                );
                const contentTop = Math.max(0, (storySize.height - storyContentSize.height) / 2);
                const verticalAlignment = getWorkoutStoryCenterAlignment(
                    savedStoryTranslateY.value + event.translationY,
                    contentTop + storyContentSize.height / 2,
                    storySize.height,
                );
                storyTranslateX.value = clampWorkoutStoryTranslation(horizontalAlignment.translation, storySize.width);
                storyTranslateY.value = clampWorkoutStoryTranslation(verticalAlignment.translation, storySize.height);
                showVerticalGuide.value = horizontalAlignment.isAligned ? 1 : 0;
                showHorizontalGuide.value = verticalAlignment.isAligned ? 1 : 0;
            } else {
                const horizontalAlignment = getWorkoutStoryCenterAlignment(
                    savedPhotoTranslateX.value + event.translationX,
                    storySize.width / 2,
                    storySize.width,
                );
                const verticalAlignment = getWorkoutStoryCenterAlignment(
                    savedPhotoTranslateY.value + event.translationY,
                    storySize.height / 2,
                    storySize.height,
                );
                photoTranslateX.value = clampWorkoutPhotoTranslation(
                    horizontalAlignment.translation,
                    photoFrame.width,
                    storySize.width,
                    photoScale.value,
                );
                photoTranslateY.value = clampWorkoutPhotoTranslation(
                    verticalAlignment.translation,
                    photoFrame.height,
                    storySize.height,
                    photoScale.value,
                );
                showVerticalGuide.value = horizontalAlignment.isAligned ? 1 : 0;
                showHorizontalGuide.value = verticalAlignment.isAligned ? 1 : 0;
            }
        })
        .onFinalize(() => {
            showVerticalGuide.value = withTiming(0, { duration: 120 });
            showHorizontalGuide.value = withTiming(0, { duration: 120 });
        }), [photo, photoFrame.height, photoFrame.width, storyContentSize.height, storyContentSize.width, storySize.height, storySize.width]);
    const pinchGesture = useMemo(() => Gesture.Pinch()
        .onBegin(event => {
            pinchTargetsCard.value = !photo || isWorkoutStoryCardAtPoint(
                event.focalX,
                event.focalY,
                storySize.width,
                storySize.height,
                storyContentSize.width,
                storyContentSize.height,
                storyTranslateX.value,
                storyTranslateY.value,
                storyScale.value,
            );
            savedStoryScale.value = storyScale.value;
            savedPhotoScale.value = photoScale.value;
        })
        .onUpdate(event => {
            if (pinchTargetsCard.value) {
                hasUserTransformedStory.value = true;
                storyScale.value = clampWorkoutStoryScale(savedStoryScale.value * event.scale);
                storyTranslateX.value = clampWorkoutStoryTranslation(storyTranslateX.value, storySize.width);
                storyTranslateY.value = clampWorkoutStoryTranslation(storyTranslateY.value, storySize.height);
            } else {
                photoScale.value = clampWorkoutPhotoScale(savedPhotoScale.value * event.scale);
                photoTranslateX.value = clampWorkoutPhotoTranslation(
                    photoTranslateX.value,
                    photoFrame.width,
                    storySize.width,
                    photoScale.value,
                );
                photoTranslateY.value = clampWorkoutPhotoTranslation(
                    photoTranslateY.value,
                    photoFrame.height,
                    storySize.height,
                    photoScale.value,
                );
            }
        }), [photo, photoFrame.height, photoFrame.width, storyContentSize.height, storyContentSize.width, storySize.height, storySize.width]);
    const cycleStoryStyle = useCallback(() => {
        setStoryStyleMode(mode => getNextWorkoutStoryStyleMode(mode));
    }, []);
    const storyGesture = useMemo(
        () => Gesture.Simultaneous(
            panGesture,
            pinchGesture,
            Gesture.Tap()
                .numberOfTaps(2)
                .onEnd((_event, success) => {
                    if (success) runOnJS(cycleStoryStyle)();
                }),
        ),
        [cycleStoryStyle, panGesture, pinchGesture],
    );
    useEffect(() => {
        if (previewArea.height > 0 && !hasUserTransformedStory.value) {
            storyScale.value = getWorkoutStoryFitScale(
                exercises.length,
                storySize.height,
                !!photo,
            );
        }
    }, [exercises.length, photo, previewArea.height, storySize.height]);

    const resetStoryLayout = () => {
        hasUserTransformedStory.value = false;
        storyScale.value = getWorkoutStoryFitScale(exercises.length, storySize.height, !!photo);
        storyTranslateX.value = 0;
        storyTranslateY.value = 0;
    };

    const handleStoryContentLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setStoryContentSize(current => current.width === width && current.height === height
            ? current
            : { width, height });
    };

    const resetPhotoCrop = () => {
        photoScale.value = 1;
        photoTranslateX.value = 0;
        photoTranslateY.value = 0;
    };

    const handleClose = useCallback(() => {
        if (isJustCompleted && isStoryEditor) {
            setIsStoryEditor(false);
            return;
        }
        const state = navigation.getState();
        const previousRoute = state.routes[state.index - 1]?.name;
        navigation.pop(getWorkoutDetailsBackCount(previousRoute));
    }, [isJustCompleted, isStoryEditor, navigation]);

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                handleClose();
                return true;
            });
            return () => backHandler.remove();
        }, [handleClose])
    );

    const totalMinutes = useMemo(() => {
        if (!duration) return 0;
        const parts = String(duration).split(':');
        const minutes = parts.length === 3
            ? Number.parseInt(parts[0], 10) * 60 + Number.parseInt(parts[1], 10)
            : Number.parseInt(parts[0], 10);
        return Number.isFinite(minutes) ? minutes : 0;
    }, [duration]);

    const { totalSets, totalPRs } = useMemo(
        () => getWorkoutCardSummary(exercises),
        [exercises],
    );

    const handleImagePick = async (useCamera = false) => {
        if (useCamera) {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Camera access needed', 'Allow camera access to add a workout photo.');
                return;
            }
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
        if (!result.canceled) {
            const asset = result.assets[0];
            setPhoto({
                uri: asset.uri,
                width: asset.width || 9,
                height: asset.height || 16,
            });
            setStoryStyleMode('glass');
            resetStoryLayout();
            resetPhotoCrop();
        }
    };

    const storySurfaceStyle = useMemo(() => {
        if (storyStyleMode === 'clear') {
            return { backgroundColor: 'transparent', borderColor: 'transparent' };
        }
        if (storyStyleMode === 'solid') {
            return { backgroundColor: colors.background.secondary, borderColor: colors.border.default };
        }
        return { backgroundColor: 'rgba(10, 14, 19, 0.68)', borderColor: colors.border.default };
    }, [storyStyleMode]);

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            const uri = await workoutCardRef.current?.capture?.();
            if (!uri) throw new Error('Workout story capture did not return an image.');
            if (!await Sharing.isAvailableAsync()) {
                Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
                return;
            }
            await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
        } catch {
            Alert.alert('Could not share workout', 'Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const handlePreviewLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setPreviewArea(current => current.width === width && current.height === height
            ? current
            : { width, height });
    };

    if (isJustCompleted && !isStoryEditor) {
        return (
            <View style={styles.completionScreen}>
                <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
                <ScrollView
                    contentContainerStyle={[
                        styles.completionContent,
                        { paddingTop: insets.top + spacing[3] },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.completionHero}>
                        <View style={styles.completionHeroAccent} />
                        <View style={styles.completionHeroContent}>
                            <View style={styles.completionHeroEyebrow}>
                                <View style={styles.completionHeroCheck}>
                                    <Ionicons name="checkmark" size={spacing.iconMd} color={colors.accent.primary} />
                                </View>
                                <Text style={styles.completionHeroLabel}>WORKOUT COMPLETE</Text>
                            </View>
                            <Text style={styles.completionHeroTitle}>
                                {workoutName || 'Workout'}
                            </Text>
                            <View style={styles.completionDuration}>
                                <Text style={styles.completionDurationValue}>{totalMinutes}</Text>
                                <View style={styles.completionDurationLabelGroup}>
                                    <Text style={styles.completionDurationUnit}>MIN</Text>
                                    <Text style={styles.completionDurationLabel}>TOTAL TIME</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.completionMetrics}>
                        <View style={styles.completionMetric}>
                            <View style={styles.completionMetricIcon}>
                                <Ionicons name="barbell-outline" size={spacing.iconMd} color={colors.text.tertiary} />
                            </View>
                            <Text style={styles.completionMetricValue}>{totalSets}</Text>
                            <Text style={styles.completionMetricLabel}>SETS</Text>
                        </View>
                        <View style={styles.completionMetricDivider} />
                        <View style={styles.completionMetric}>
                            <View
                                style={[
                                    styles.completionMetricIcon,
                                    totalPRs > 0 && styles.completionMetricIconPR,
                                ]}
                            >
                                <Ionicons
                                    name="trophy-outline"
                                    size={spacing.iconMd}
                                    color={totalPRs > 0 ? colors.accent.primary : colors.text.tertiary}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.completionMetricValue,
                                    totalPRs > 0 && styles.completionMetricValuePR,
                                ]}
                            >
                                {totalPRs}
                            </Text>
                            <Text style={styles.completionMetricLabel}>PRs</Text>
                        </View>
                    </View>

                    <View style={styles.completionExerciseHeader}>
                        <Text style={styles.completionSectionTitle}>Exercises</Text>
                        <Text style={styles.completionExerciseCount}>
                            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Text>
                    </View>
                    <View style={styles.completionExerciseList}>
                        {exercises.map((exercise, index) => {
                            const best = findBestSet(exercise.sets);
                            const bestSetIsPR = exercise.sets.some(set =>
                                !!set.isPR &&
                                Number(set.weight ?? 0) === best.weight &&
                                Number(set.reps ?? 0) === best.reps,
                            );

                            return (
                                <View
                                    key={`${exercise.exerciseName}-${index}`}
                                    style={[
                                        styles.completionExerciseRow,
                                        index === exercises.length - 1 && styles.completionExerciseRowLast,
                                    ]}
                                >
                                    <View style={styles.completionExerciseLeft}>
                                        <Text style={styles.completionExerciseSets}>{exercise.sets.length}x</Text>
                                        <Text style={styles.completionExerciseName} numberOfLines={1}>
                                            {exercise.exerciseName || 'Exercise'}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.completionBestSet,
                                            bestSetIsPR && styles.completionBestSetPR,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {formatBestSet(best) || '-'}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {!!notes?.trim() && (
                        <View style={styles.completionNotes}>
                            <Text style={styles.completionSectionTitle}>Workout note</Text>
                            <Text style={styles.completionNotesText}>{notes.trim()}</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.completionActions, { paddingBottom: insets.bottom + spacing[3] }]}>
                    <View style={styles.completionActionRow}>
                        <TouchableOpacity
                            style={styles.completionShareButton}
                            onPress={() => setIsStoryEditor(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Create and share workout story"
                        >
                            <Ionicons name="share-outline" size={spacing.iconMd} color={colors.background.primary} />
                            <Text style={styles.completionShareText}>Share story</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.completionDoneButton}
                            onPress={handleClose}
                            accessibilityRole="button"
                            accessibilityLabel="Done and return to workout"
                        >
                            <Text style={styles.completionDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container} onLayout={handlePreviewLayout}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <GestureDetector gesture={storyGesture}>
                <ViewShot
                    ref={workoutCardRef}
                    style={[styles.storyCanvas, storySize]}
                    options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                >
                    <View style={styles.storyBackground}>
                        {photo ? (
                            <>
                                <Image
                                    source={{ uri: photo.uri }}
                                    style={styles.photoBackdrop}
                                    contentFit="cover"
                                    blurRadius={28}
                                />
                                <LinearGradient
                                    colors={['rgba(5, 8, 11, 0.3)', 'rgba(5, 8, 11, 0.12)', 'rgba(5, 8, 11, 0.38)']}
                                    locations={[0, 0.5, 1]}
                                    style={styles.storyPhotoShade}
                                    pointerEvents="none"
                                />
                                <Animated.View
                                    style={[
                                        styles.photoLayer,
                                        photoFrame,
                                        {
                                            left: (storySize.width - photoFrame.width) / 2,
                                            top: (storySize.height - photoFrame.height) / 2,
                                        },
                                        photoStyle,
                                    ]}
                                >
                                    <Image
                                        source={{ uri: photo.uri }}
                                        style={styles.backgroundImage}
                                        contentFit="contain"
                                    />
                                </Animated.View>
                            </>
                        ) : (
                            <LinearGradient
                                colors={[
                                    colors.background.secondary,
                                    colors.background.primary,
                                    colors.background.secondary,
                                ]}
                                locations={[0, 0.5, 1]}
                                style={styles.storyDefaultBackground}
                            />
                        )}
                    </View>

                    <Animated.View
                        onLayout={handleStoryContentLayout}
                        style={[
                            styles.storyContent,
                            !photo && styles.storyContentNoPhoto,
                            storyContentStyle,
                            { top: Math.max(0, (storySize.height - storyContentSize.height) / 2) },
                        ]}
                    >
                        <View style={[styles.storyHighlights, !photo && styles.storyHighlightsNoPhoto]}>
                            {!photo && (
                                <View style={styles.noPhotoHero}>
                                    <View style={styles.noPhotoIcon}>
                                        <Ionicons name="barbell-outline" size={spacing[7]} color={colors.accent.primary} />
                                    </View>
                                    <Text style={styles.noPhotoEyebrow}>
                                        {isJustCompleted ? 'WORKOUT COMPLETE' : 'SESSION RECAP'}
                                    </Text>
                                </View>
                            )}
                            <Text
                                style={[styles.heroTitle, !photo && styles.heroTitleNoPhoto]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {workoutName || 'Workout'}
                            </Text>

                            <View style={[styles.statsRow, storySurfaceStyle]}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{totalMinutes}</Text>
                                    <Text style={styles.statLabel}>MINUTES</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{totalSets}</Text>
                                    <Text style={styles.statLabel}>SETS</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{totalPRs}</Text>
                                    <Text style={styles.statLabel}>PRs</Text>
                                </View>
                            </View>

                            <View style={[styles.listContainer, storySurfaceStyle]}>
                                {exercises.map((exercise, index) => {
                                    const best = findBestSet(exercise.sets);
                                    const bestSetIsPR = exercise.sets.some(set =>
                                        !!set.isPR &&
                                        Number(set.weight ?? 0) === best.weight &&
                                        Number(set.reps ?? 0) === best.reps,
                                    );

                                    return (
                                        <View
                                            key={`${exercise.exerciseName}-${index}`}
                                            style={[
                                                styles.exerciseRow,
                                                index === exercises.length - 1 && styles.exerciseRowLast,
                                                storyStyleMode === 'clear' && styles.exerciseRowClear,
                                            ]}
                                            accessible
                                            accessibilityLabel={`${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}, ${exercise.exerciseName || 'Exercise'}, best set ${formatBestSet(best) || '-'}${bestSetIsPR ? ', Personal record' : ''}`}
                                        >
                                            <View style={styles.exerciseLeft}>
                                                <Text style={styles.exerciseSets}>{exercise.sets.length}x</Text>
                                                <Text style={styles.exerciseName} numberOfLines={1}>
                                                    {exercise.exerciseName || 'Exercise'}
                                                </Text>
                                            </View>
                                            <Text style={[styles.bestSetValue, bestSetIsPR && styles.bestSetValuePR]} numberOfLines={1}>
                                                {formatBestSet(best) || '-'}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        <Text style={styles.storyFooter}>TRAINED WITH UPTRACK</Text>
                    </Animated.View>
                </ViewShot>
            </GestureDetector>

            <Animated.View
                pointerEvents="none"
                style={[styles.centerGuideVertical, verticalGuideStyle]}
            />
            <Animated.View
                pointerEvents="none"
                style={[styles.centerGuideHorizontal, horizontalGuideStyle]}
            />

            <View style={[styles.screenHeader, { paddingTop: insets.top + spacing[2] }]}>
                <TouchableOpacity
                    style={styles.headerBackButton}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close workout recap"
                >
                    <Ionicons name="chevron-back" size={spacing.iconMd} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.screenHeaderText}>
                    <Text style={styles.screenTitle}>
                        {isJustCompleted ? 'Workout complete' : 'Workout recap'}
                    </Text>
                    <Text style={styles.screenSubtitle}>
                        {photo
                            ? 'Drag/pinch recap to move it · use photo space to crop'
                            : 'Add a photo for your story · drag or pinch recap to place it'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                        resetStoryLayout();
                        resetPhotoCrop();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Reset workout card and photo"
                >
                    <Ionicons name="refresh-outline" size={spacing.iconMd} color={colors.text.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + spacing[2] }]}>
                {!photo && (
                    <Text style={styles.photoPrompt}>
                        Add a photo to make this workout story yours
                    </Text>
                )}
                <View style={styles.secondaryRow}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => handleImagePick(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Take workout background photo"
                    >
                        <Ionicons name="camera-outline" size={spacing.iconMd} color={colors.text.primary} />
                        <Text style={styles.secondaryBtnText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => handleImagePick(false)}
                        accessibilityRole="button"
                        accessibilityLabel={photo ? 'Change workout background photo' : 'Add workout background photo'}
                    >
                        <Ionicons name="image-outline" size={spacing.iconMd} color={colors.text.primary} />
                        <Text style={styles.secondaryBtnText}>{photo ? 'Change photo' : 'Choose photo'}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.primaryBtn, isSharing && styles.primaryBtnDisabled]}
                    onPress={handleShare}
                    disabled={isSharing}
                    accessibilityRole="button"
                    accessibilityLabel="Share workout story"
                >
                    {isSharing ? (
                        <ActivityIndicator color={colors.background.primary} />
                    ) : (
                        <>
                            <Ionicons name="share-outline" size={spacing.iconMd} color={colors.background.primary} />
                            <Text style={styles.primaryBtnText}>Share story</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default WorkoutDetails;
