import { useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StatusBar,
    BackHandler,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
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
import { formatWorkoutDate } from '../../utils/formatWorkoutDate';
import { getWorkoutDetailsBackCount } from './workoutDetailsNavigation';
import { getWorkoutStorySize } from './workoutStoryLayout';

const MAX_STORY_EXERCISES = 8;

const WorkoutDetails = () => {
    const navigation = useAppNavigation();
    const route = useAppRoute<'WorkoutDetails'>();
    const { duration, exercises: rawExercises, workoutName, timestamp } = route.params;
    const exercises = rawExercises ?? [];
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const insets = useSafeAreaInsets();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const storySize = getWorkoutStorySize(windowWidth, windowHeight, insets.top, insets.bottom);
    const workoutCardRef = useRef<ViewShot>(null);

    const handleClose = useCallback(() => {
        const state = navigation.getState();
        const previousRoute = state.routes[state.index - 1]?.name;
        navigation.pop(getWorkoutDetailsBackCount(previousRoute));
    }, [navigation]);

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
            ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.9 })
            : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.9 });
        if (!result.canceled) setPhotoUri(result.assets[0].uri);
    };

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

    const visibleExercises = exercises.slice(0, MAX_STORY_EXERCISES);
    const remainingExercises = Math.max(0, exercises.length - visibleExercises.length);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={[styles.screenHeader, { paddingTop: insets.top + spacing[2] }]}>
                <TouchableOpacity
                    style={styles.headerBackButton}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close workout story"
                >
                    <Ionicons name="chevron-back" size={spacing.iconMd} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.screenHeaderText}>
                    <Text style={styles.screenTitle}>Workout story</Text>
                    <Text style={styles.screenSubtitle}>A recap worth sharing</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.previewContainer}>
                <ViewShot
                    ref={workoutCardRef}
                    style={[styles.storyCanvas, storySize]}
                    options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                >
                    <View style={styles.storyBackground}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.backgroundImage} contentFit="cover" />
                        ) : (
                            <LinearGradient
                                colors={['#24313B', '#11171C', '#090C0F']}
                                style={styles.storyDefaultBackground}
                            />
                        )}
                        <LinearGradient
                            colors={['rgba(5, 8, 11, 0.5)', 'transparent', 'rgba(5, 8, 11, 0.25)']}
                            locations={[0, 0.42, 1]}
                            style={styles.storyPhotoShade}
                        />
                    </View>

                    <View style={styles.storyContent}>
                        <View style={styles.storyHeader}>
                            <View style={styles.brandContainer}>
                                <View style={styles.logoContainer}>
                                    <Image
                                        source={require('../../../../../assets/uptrack-icon.png')}
                                        style={styles.logoImage}
                                        contentFit="contain"
                                    />
                                </View>
                                <Text style={styles.brandText}>UPTRACK</Text>
                            </View>
                            <Text style={styles.storyDate}>{formatWorkoutDate(timestamp || new Date())}</Text>
                        </View>

                        <View style={styles.storyHighlights}>
                            <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
                                {workoutName || 'Workout'}
                            </Text>

                            <View style={styles.statsRow}>
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

                            <View style={styles.listContainer}>
                                {visibleExercises.map((exercise, index) => {
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
                                                index === visibleExercises.length - 1 && remainingExercises === 0 && styles.exerciseRowLast,
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
                                {remainingExercises > 0 && (
                                    <Text style={styles.moreExercises}>
                                        + {remainingExercises} more {remainingExercises === 1 ? 'exercise' : 'exercises'}
                                    </Text>
                                )}
                            </View>

                            <Text style={styles.storyFooter}>TRAINED WITH UPTRACK</Text>
                        </View>
                    </View>
                </ViewShot>
            </View>

            <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + spacing[2] }]}>
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
                        accessibilityLabel={photoUri ? 'Change workout background photo' : 'Choose workout background photo'}
                    >
                        <Ionicons name="image-outline" size={spacing.iconMd} color={colors.text.primary} />
                        <Text style={styles.secondaryBtnText}>{photoUri ? 'Change photo' : 'Choose photo'}</Text>
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
