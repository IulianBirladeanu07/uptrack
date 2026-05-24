import { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing } from '../../../../shared/theme';
import styles from './WorkoutDetailsStyle';
import { findBestSet } from '../../handlers/WorkoutHandler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatDate = () => {
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
};

const WorkoutDetails = ({ route, navigation }) => {
    const { duration, exercises, workoutName } = route.params;
    const [selfieUri, setSelfieUri] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const insets = useSafeAreaInsets();
    const workoutCardRef = useRef();

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const savedScale = useSharedValue(1);

    const totalMinutes = useMemo(() => {
        const parts = duration?.split(':') || ['0', '0'];
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }, [duration]);

    const totalSets = useMemo(() => exercises.reduce((acc, ex) => acc + ex.sets.length, 0), [exercises]);
    const totalPRs = useMemo(() => exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.isPR).length, 0), [exercises]);

    const exFontSize = exercises.length <= 5 ? 14 : exercises.length <= 8 ? 12 : 10;

    const panGesture = Gesture.Pan()
        .enabled(!!selfieUri)
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        });

    const pinchGesture = Gesture.Pinch()
        .enabled(!!selfieUri)
        .onStart(() => { savedScale.value = scale.value; })
        .onUpdate((e) => { scale.value = savedScale.value * e.scale; });

    const composed = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const handleImagePick = async (useCamera = false) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') return;
        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [9, 16], quality: 1.0 })
            : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [9, 16], quality: 1.0 });
        if (!result.canceled) {
            translateX.value = 0; translateY.value = 0; scale.value = 1;
            savedTranslateX.value = 0; savedTranslateY.value = 0; savedScale.value = 1;
            setSelfieUri(result.assets[0].uri);
        }
    };

    const handleRemovePhoto = () => {
        setSelfieUri(null);
        translateX.value = 0; translateY.value = 0; scale.value = 1;
        savedTranslateX.value = 0; savedTranslateY.value = 0; savedScale.value = 1;
    };

    const handleShare = async () => {
        setIsSharing(true);
        setTimeout(async () => {
            try {
                const uri = await captureRef(workoutCardRef, { format: 'png', quality: 1.0, result: 'tmpfile' });
                await Sharing.shareAsync(uri);
            } catch (e) {
                Alert.alert('Error sharing');
            } finally {
                setIsSharing(false);
            }
        }, 150);
    };

    const cardContent = (
        <>
            <View style={styles.cardTopBar}>
                <View style={styles.cardBrandRow}>
                    <View style={styles.cardLogo}>
                        <Image
                            source={require('../../../../../assets/uptrack-icon.png')}
                            style={styles.cardLogoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.cardBrandText}>UPTRACK</Text>
                </View>
                <Text style={styles.cardDateText}>{formatDate()}</Text>
            </View>

            <View style={styles.cardHero}>
                <Text style={styles.cardCompletedLabel}>WORKOUT COMPLETE</Text>
                <Text style={styles.cardWorkoutName} numberOfLines={2}>
                    {workoutName?.trim() || 'Workout Complete'}
                </Text>
                <View style={styles.cardStatsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.cardStatValue}>{totalMinutes}m</Text>
                        <Text style={styles.cardStatLabel}>Time</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.cardStatValue}>{totalSets}</Text>
                        <Text style={styles.cardStatLabel}>Sets</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.cardStatValue}>{exercises.length}</Text>
                        <Text style={styles.cardStatLabel}>Exercises</Text>
                    </View>
                    {totalPRs > 0 && (
                        <>
                            <View style={styles.cardStatDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.cardStatValue, { color: colors.accent.primary }]}>{totalPRs}</Text>
                                <Text style={[styles.cardStatLabel, { color: colors.accent.primary, opacity: 0.6 }]}>PRs</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            <View style={styles.cardExercises}>
                <View style={styles.cardExerciseHeader}>
                    <Text style={styles.cardExerciseHeaderLabel}>EXERCISE</Text>
                    <Text style={styles.cardExerciseHeaderLabel}>BEST</Text>
                </View>
                {exercises.map((ex, i) => {
                    const best = findBestSet(ex.sets);
                    const hasPR = ex.sets.some(s => s.isPR);
                    return (
                        <View key={i} style={[styles.cardExerciseRow, i === exercises.length - 1 && styles.cardExerciseRowLast]}>
                            <View style={styles.cardExerciseLeft}>
                                <Text style={[styles.cardExerciseSets, { fontSize: exFontSize }]}>{ex.sets.length}x</Text>
                                <Text style={[styles.cardExerciseName, { fontSize: exFontSize }]} numberOfLines={1}>{ex.exerciseName}</Text>
                            </View>
                            <Text style={[styles.cardBestSet, hasPR && styles.cardBestSetPR, { fontSize: exFontSize }]}>
                                {best.weight && best.reps ? `${best.weight}kg × ${best.reps}` : '-'}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </>
    );

    const controls = (
        <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + spacing[2] }]}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="logo-instagram" size={18} color={colors.accent.buttonText} />
                <Text style={styles.shareBtnText}>Share to Socials</Text>
            </TouchableOpacity>
            <View style={styles.secondaryRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(true)} activeOpacity={0.7}>
                    <Ionicons name="camera" size={18} color={colors.text.primary} />
                    <Text style={styles.secondaryBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(false)} activeOpacity={0.7}>
                    <Ionicons name="image" size={18} color={colors.text.primary} />
                    <Text style={styles.secondaryBtnText}>Library</Text>
                </TouchableOpacity>
                {selfieUri && (
                    <TouchableOpacity style={styles.removeBtn} onPress={handleRemovePhoto} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={18} color={colors.accent.error} />
                        <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const controlsHeight = insets.bottom + 140;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ViewShot
                ref={workoutCardRef}
                style={[styles.canvas, !isSharing && { bottom: controlsHeight }]}
            >
                {selfieUri && (
                    <>
                        <Image source={{ uri: selfieUri }} style={styles.backgroundImage} resizeMode="cover" />
                        <View style={styles.backgroundOverlay} />
                    </>
                )}

                {selfieUri ? (
                    <GestureDetector gesture={composed}>
                        <Animated.View style={[styles.floatingCard, { top: SCREEN_HEIGHT * 0.08 }, animatedStyle]}>
                            {cardContent}
                        </Animated.View>
                    </GestureDetector>
                ) : (
                    <View style={[styles.fullScreen, { paddingTop: insets.top + spacing[4] }]}>
                        <View style={styles.shareCard}>
                            {cardContent}
                        </View>
                    </View>
                )}
            </ViewShot>

            {!isSharing && (
                <TouchableOpacity
                    style={[styles.closeBtn, { top: insets.top + spacing[2] }]}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <Ionicons name="close" size={20} color={colors.text.primary} />
                </TouchableOpacity>
            )}

            {!isSharing && controls}
        </View>
    );
};

export default WorkoutDetails;