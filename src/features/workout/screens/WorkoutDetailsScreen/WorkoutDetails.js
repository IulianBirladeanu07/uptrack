import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import styles from './WorkoutDetailsStyle';
import { colors, spacing } from '../../../../shared/theme';
import { findBestSet } from '../../handlers/WorkoutHandler';

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

    const formatDate = () => {
        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[now.getMonth()]} ${now.getDate()}`;
    };

    const totalMinutes = useMemo(() => {
        if (!duration) return 0;
        const parts = duration.split(':');
        if (parts.length === 3) {
            return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        }
        return parseInt(parts[0]);
    }, [duration]);

    const totalSets = useMemo(() => exercises.reduce((acc, ex) => acc + ex.sets.length, 0), [exercises]);
    const totalPRs = useMemo(() => exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.isPR).length, 0), [exercises]);

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
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        });

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
            ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.8 })
            : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.8 });
        if (!result.canceled) setSelfieUri(result.assets[0].uri);
    };

    const handleShare = async () => {
        setIsSharing(true);
        setTimeout(async () => {
            try {
                const uri = await captureRef(workoutCardRef, {
                    format: 'png',
                    quality: 1.0,
                    result: 'tmpfile',
                });
                await Sharing.shareAsync(uri);
            } catch (e) {
                Alert.alert('Error', 'Could not share workout card.');
            } finally {
                setIsSharing(false);
            }
        }, 150);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {!isSharing && (
                <TouchableOpacity
                    style={[styles.closeBtn, { top: insets.top + spacing[3] }]}
                    onPress={() => navigation.navigate('Workout')}
                >
                    <Ionicons name="close" size={spacing.iconMd} color={colors.text.primary} />
                </TouchableOpacity>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing[45] + insets.bottom }}
            >
                <ViewShot ref={workoutCardRef} style={{ backgroundColor: colors.background.primary }}>
                    <View style={styles.backgroundContainer}>
                        {selfieUri ? (
                            <Image source={{ uri: selfieUri }} style={styles.backgroundImage} contentFit="cover" />
                        ) : (
                            <LinearGradient
                                colors={['#1C2333', colors.background.primary]}
                                style={styles.backgroundGradient}
                            />
                        )}
                        <View style={styles.backgroundOverlay} />
                    </View>

                    <GestureDetector gesture={composed}>
                        <Animated.View style={[styles.workoutCard, animatedStyle]}>
                            <View style={styles.cardHeader}>
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
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>{formatDate()}</Text>
                                </View>
                            </View>

                            <View style={styles.heroSection}>
                                <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
                                    {(workoutName || 'Workout').toUpperCase()}
                                </Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{totalMinutes}m</Text>
                                        <Text style={styles.statLabel}>Time</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{totalSets}</Text>
                                        <Text style={styles.statLabel}>Sets</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{totalPRs}</Text>
                                        <Text style={styles.statLabel}>PRs</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.listContainer}>
                                <View style={styles.listHeader}>
                                    <Text style={styles.listHeaderExercise}>EXERCISE</Text>
                                    <Text style={styles.listHeaderBest}>BEST SET</Text>
                                </View>
                                {exercises.map((ex, i) => {
                                    const best = findBestSet(ex.sets);
                                    const hasPR = ex.sets.some(s => s.isPR);
                                    return (
                                        <View
                                            key={i}
                                            style={[
                                                styles.exerciseRow,
                                                i === exercises.length - 1 && styles.exerciseRowLast,
                                            ]}
                                        >
                                            <View style={styles.exerciseLeft}>
                                                <Text style={styles.exerciseSets}>{ex.sets.length}x</Text>
                                                <Text style={styles.exerciseName} numberOfLines={1}>
                                                    {ex.exerciseName}
                                                </Text>
                                            </View>
                                            <View style={styles.bestSetContainer}>
                                                <Text style={[styles.bestSetValue, hasPR && styles.bestSetValuePR]}>
                                                    {best.weight}kg × {best.reps}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </ViewShot>
            </ScrollView>

            {!isSharing && (
                <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + spacing[2] }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
                        <LinearGradient
                            colors={[colors.accent.primary, colors.accent.primaryDark]}
                            style={styles.primaryBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="logo-instagram" size={spacing.iconMd} color={colors.background.primary} />
                            <Text style={styles.primaryBtnText}>Share to Socials</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.secondaryRow}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(true)}>
                            <Ionicons name="camera" size={spacing.iconMd} color={colors.text.primary} />
                            <Text style={styles.secondaryBtnText}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(false)}>
                            <Ionicons name="image" size={spacing.iconMd} color={colors.text.primary} />
                            <Text style={styles.secondaryBtnText}>Library</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default WorkoutDetails;