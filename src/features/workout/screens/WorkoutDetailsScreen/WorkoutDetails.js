  import React, { useState, useRef, useMemo } from 'react';
  import { View, Text, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import * as ImagePicker from 'expo-image-picker';
  import { LinearGradient } from 'expo-linear-gradient';
  import * as Sharing from 'expo-sharing';
  import ViewShot, { captureRef } from 'react-native-view-shot';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
  import { Gesture, GestureDetector } from 'react-native-gesture-handler';
  import styles, { COLORS } from './WorkoutDetailsStyle';
  import { findBestSet } from '../../handlers/WorkoutHandler';

  const WorkoutDetails = ({ route, navigation }) => {
    const { duration, exercises, timestamp } = route.params;
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
      const month = months[now.getMonth()];
      const date = now.getDate();
      return `${month} ${date}`;
    };

    const totalMinutes = useMemo(() => {
      const parts = duration?.split(':') || ['0', '0'];
      return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
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
        { scale: scale.value }
      ]
    }));

    const handleImagePick = async (useCamera = false) => {
      const permission = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') return;

      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [9, 16], quality: 0.8 });

      if (!result.canceled) {
        setSelfieUri(result.assets[0].uri);
      }
    };

  const handleShare = async () => {
    setIsSharing(true);
    setTimeout(async () => {
      try {
        const uri = await captureRef(workoutCardRef, { 
          format: 'png', 
          quality: 1.0,
          result: 'tmpfile'
        });
        await Sharing.shareAsync(uri);
      } catch (e) {
        Alert.alert("Error sharing");
      } finally {
        setIsSharing(false);
      }
    }, 150);
  };
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {!isSharing && (
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('Workout')}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

          <ViewShot ref={workoutCardRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.bg }}>
            <View style={styles.backgroundContainer}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.backgroundImage} />
            ) : (
              <LinearGradient colors={['#1a1a1a', '#0A0E13']} style={styles.backgroundGradient} />
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
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.brandText}>UPTRACK</Text>
                </View>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{formatDate()}</Text>
                </View>
              </View>

              <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>WORKOUT{'\n'}COMPLETE</Text>
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
                {exercises.map((ex, i) => {
                  const best = findBestSet(ex.sets);
                  const hasPR = ex.sets.some(s => s.isPR);
                  return (
                    <View key={i} style={[styles.exerciseRow, i === exercises.length - 1 && styles.exerciseRowLast]}>
                      <View style={styles.exerciseLeft}>
                        <Text style={styles.exerciseSets}>{ex.sets.length}x</Text>
                        <Text style={styles.exerciseName} numberOfLines={1}>{ex.exerciseName}</Text>
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

        {!isSharing && (
          <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
              <LinearGradient colors={[COLORS.primary, '#E68600']} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="logo-instagram" size={20} color={COLORS.bg} />
                <Text style={styles.primaryBtnText}>Share to Socials</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(true)}>
                <Ionicons name="camera" size={20} color={COLORS.textPrimary} />
                <Text style={styles.secondaryBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleImagePick(false)}>
                <Ionicons name="image" size={20} color={COLORS.textPrimary} />
                <Text style={styles.secondaryBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  export default WorkoutDetails;