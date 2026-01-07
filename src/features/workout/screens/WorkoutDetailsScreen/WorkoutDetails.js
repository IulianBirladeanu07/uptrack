import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions, StatusBar, Image, PanResponder, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { findBestSet } from '../../handlers/WorkoutHandler';
import styles from './WorkoutDetailsStyle';
import { normalize } from '../../../../shared/hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const WorkoutDetails = ({ route, navigation }) => {
  const { duration, notes, exercises, timestamp } = route.params;
  const [selfieUri, setSelfieUri] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [cardStyle, setCardStyle] = useState('modern');
  const [hideControls, setHideControls] = useState(false);
  
  const workoutCardRef = useRef();
  const cardScale = 1;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: cardScale,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0m";
    const parts = duration.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }, []);

  const stats = {
    duration: formatDuration(duration),
    exercises: exercises.length,
    sets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
    volume: exercises.reduce((totalVol, exercise) => {
      return totalVol + exercise.sets.reduce((setVol, set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        return setVol + weight * reps;
      }, 0);
    }, 0).toFixed(0),
    prs: exercises.reduce((count, exercise) => {
      return count + exercise.sets.filter(set => set.isPR).length;
    }, 0),
  };

  const topExercises = exercises
    .slice(0, 4)
    .map(exercise => {
      const bestSet = findBestSet(exercise.sets);
      const hasPR = exercise.sets.some(set => set.isPR);
      return {
        name: exercise.exerciseName,
        bestSet: bestSet.weight && bestSet.reps 
          ? `${bestSet.weight}kg × ${bestSet.reps}` 
          : '-',
        hasPR,
      };
    });

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editMode,
    onMoveShouldSetPanResponder: () => editMode,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value
      });
      pan.setValue({ x: 0, y: 0 });
      Animated.spring(scale, {
        toValue: 1.02, 
        useNativeDriver: true,
        friction: 7,
      }).start();
    },
    
    onPanResponderMove: (e, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    
    onPanResponderRelease: () => {
      pan.flattenOffset();
      Animated.spring(scale, {
        toValue: 1, 
        useNativeDriver: true,
        friction: 7,
      }).start();
    }
  }), [editMode]);

  const captureAndShare = async () => {
    if (!selfieUri) {
      Alert.alert('Add Photo First', 'Take a selfie to create your shareable workout card 📸');
      return;
    }

    const wasEditMode = editMode;
    if (wasEditMode) setEditMode(false);
    setHideControls(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const uri = await captureRef(workoutCardRef, {
        format: 'png',
        quality: 1.0,
      });
      
      if (uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your workout progress!',
          });
        } else {
          Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        }
      }
      
    } catch (error) {
      console.error("ViewShot Error:", error);
      Alert.alert("Error", "Could not capture the image for sharing. Is the card fully on screen?");
    } finally {
      if (wasEditMode) setEditMode(true);
      setHideControls(false);
    }
  };

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take a selfie');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setSelfieUri(result.assets[0].uri);
        pan.setValue({ x: 0, y: 0 }); 
        setEditMode(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setSelfieUri(result.assets[0].uri);
        pan.setValue({ x: 0, y: 0 }); 
        setEditMode(true);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      selfie ? 'Photo Options' : 'Add Photo',
      'Create your shareable workout card',
      [
        { text: 'Take Selfie', onPress: takeSelfie },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        ...(selfieUri ? [
          { text: 'Remove Photo', onPress: () => setSelfieUri(null), style: 'destructive' }
        ] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const cycleCardStyle = () => {
    const styles = ['modern', 'minimal', 'bold'];
    const currentIndex = styles.indexOf(cardStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setCardStyle(styles[nextIndex]);
    
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 10,
      }),
      Animated.spring(scale, {
        toValue: cardScale,
        useNativeDriver: true,
        friction: 8,
      })
    ]).start();
  };

  const getCardColors = () => {
    switch(cardStyle) {
      case 'minimal':
        return ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)'];
      case 'bold':
        return ['rgba(255, 133, 53, 0.3)', 'rgba(255, 107, 26, 0.25)'];
      default: // modern
        return ['rgba(15, 23, 42, 0.96)', 'rgba(30, 41, 59, 0.94)'];
    }
  };

  const getCardHeight = () => {
    if (cardStyle === 'minimal') return normalize(240);
    return normalize(420);
  };

  const getStyleName = () => {
    switch(cardStyle) {
      case 'minimal': return 'Minimal';
      case 'bold': return 'Bold';
      default: return 'Modern';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ViewShot 
        ref={workoutCardRef}
        options={{ format: 'png', quality: 1.0 }}
        style={{ flex: 1 }}
      >
        <View style={styles.backgroundContainer}>
          {selfieUri ? (
            <>
              <Image 
                source={{ uri: selfieUri }} 
                style={styles.backgroundImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.4)', 
                  'rgba(0,0,0,0.1)', 
                  'rgba(0,0,0,0.1)',
                  'rgba(0,0,0,0.6)'
                ]}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.backgroundOverlay}
              />
            </>
          ) : (
            <LinearGradient
              colors={['#0F172A', '#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backgroundGradient}
            />
          )}
        </View>

        {selfieUri && (
          <Animated.View
            style={[
              styles.workoutCard,
              {
                top: height * 0.5 - getCardHeight() / 2,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale }
                ],
                opacity: fadeAnim,
              }
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              colors={getCardColors()}
              style={[
                styles.cardGradient, 
                { height: getCardHeight() }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[
                    styles.iconCircle,
                    cardStyle === 'bold' && styles.iconCircleBold
                  ]}>
                    <Ionicons 
                      name="barbell" 
                      size={normalize(20)} 
                      color={cardStyle === 'bold' ? '#FFD700' : '#FF8535'} 
                    />
                  </View>
                  <View>
                    <Text style={[
                      styles.cardTitle,
                      cardStyle === 'minimal' && styles.cardTitleMinimal
                    ]}>
                      WORKOUT COMPLETE
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {new Date(timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                {stats.prs > 0 && (
                  <View style={[
                    styles.prBadgeCard,
                    cardStyle === 'bold' && styles.prBadgeCardBold
                  ]}>
                    <Ionicons name="trophy" size={normalize(14)} color="#FFD700" />
                    <Text style={styles.prBadgeText}>
                      {stats.prs} PR{stats.prs > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.mainStatsGrid}>
                <View style={styles.mainStatItem}>
                  <View style={[
                    styles.statIconContainer,
                    cardStyle === 'bold' && styles.statIconContainerBold
                  ]}>
                    <Ionicons 
                      name="time" 
                      size={normalize(24)} 
                      color={cardStyle === 'bold' ? '#FFD700' : '#FF8535'} 
                    />
                  </View>
                  <Text style={[
                    styles.mainStatValue,
                    cardStyle === 'minimal' && styles.mainStatValueMinimal
                  ]}>
                    {stats.duration}
                  </Text>
                  <Text style={styles.mainStatLabel}>Duration</Text>
                </View>
                
                <View style={styles.mainStatDivider} />
                
                <View style={styles.mainStatItem}>
                  <View style={[
                    styles.statIconContainer,
                    cardStyle === 'bold' && styles.statIconContainerBold
                  ]}>
                    <Ionicons 
                      name="barbell" 
                      size={normalize(24)} 
                      color={cardStyle === 'bold' ? '#10B981' : '#06B6D4'} 
                    />
                  </View>
                  <Text style={[
                    styles.mainStatValue,
                    cardStyle === 'minimal' && styles.mainStatValueMinimal
                  ]}>
                    {stats.volume}
                  </Text>
                  <Text style={styles.mainStatLabel}>Volume (kg)</Text>
                </View>
                
                <View style={styles.mainStatDivider} />
                
                <View style={styles.mainStatItem}>
                  <View style={[
                    styles.statIconContainer,
                    cardStyle === 'bold' && styles.statIconContainerBold
                  ]}>
                    <Ionicons 
                      name="fitness" 
                      size={normalize(24)} 
                      color={cardStyle === 'bold' ? '#EC4899' : '#A855F7'} 
                    />
                  </View>
                  <Text style={[
                    styles.mainStatValue,
                    cardStyle === 'minimal' && styles.mainStatValueMinimal
                  ]}>
                    {stats.exercises}
                  </Text>
                  <Text style={styles.mainStatLabel}>Exercises</Text>
                </View>
              </View>

              {cardStyle !== 'minimal' && (
                <>
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.bestSetsSection}>
                    <Text style={[
                      styles.sectionTitle,
                      cardStyle === 'bold' && styles.sectionTitleBold
                    ]}>
                      💪 Top Sets
                    </Text>
                    
                    <View style={styles.exercisesList}>
                      {topExercises.map((exercise, index) => (
                        <View key={index} style={styles.exerciseItem}>
                          <View style={styles.exerciseLeft}>
                            <View style={[
                              styles.exerciseNumber,
                              exercise.hasPR && styles.exerciseNumberPR,
                              cardStyle === 'bold' && styles.exerciseNumberBold
                            ]}>
                              <Text style={[
                                styles.exerciseNumberText,
                                exercise.hasPR && styles.exerciseNumberTextPR
                              ]}>
                                {index + 1}
                              </Text>
                            </View>
                            <View style={styles.exerciseInfo}>
                              <Text style={[
                                styles.exerciseName,
                                cardStyle === 'minimal' && styles.exerciseNameMinimal
                              ]} numberOfLines={1}>
                                {exercise.name}
                              </Text>
                              <Text style={styles.exerciseBest}>
                                {exercise.bestSet}
                              </Text>
                            </View>
                          </View>
                          {exercise.hasPR && (
                            <View style={[
                              styles.prTag,
                              cardStyle === 'bold' && styles.prTagBold
                            ]}>
                              <Ionicons name="trophy" size={normalize(11)} color="#FFD700" />
                              <Text style={styles.prTagText}>PR</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                    
                    {exercises.length > 4 && (
                      <Text style={styles.moreText}>
                        +{exercises.length - 4} more exercise{exercises.length - 4 > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.footerBrand}>
                  <Ionicons 
                    name="fitness-outline" 
                    size={normalize(16)} 
                    color={cardStyle === 'bold' ? '#FFD700' : '#FF8535'} 
                  />
                  <Text style={[
                    styles.footerText,
                    cardStyle === 'minimal' && styles.footerTextMinimal
                  ]}>
                    UPTRACK
                  </Text>
                </View>
                <View style={styles.footerStats}>
                  <Text style={styles.footerStatsText}>{stats.sets} sets logged</Text>
                </View>
              </View>
            </LinearGradient>

            {editMode && (
              <View style={styles.dragIndicator}>
                <Ionicons name="move" size={normalize(16)} color="#FF8535" />
              </View>
            )}
          </Animated.View>
        )}
      </ViewShot>

      {!selfieUri && (
        <Animated.View style={[styles.noPhotoState, { opacity: fadeAnim }]}>
          <View style={styles.noPhotoIconContainer}>
            <LinearGradient
              colors={['#FF8535', '#FF6B1A']}
              style={styles.noPhotoIconGradient}
            >
              <Ionicons name="camera" size={normalize(56)} color="#FFF" />
            </LinearGradient>
          </View>
          
          <Text style={styles.noPhotoTitle}>Share Your Victory! 💪</Text>
          <Text style={styles.noPhotoText}>
            Take a selfie and create an Instagram-worthy{'\n'}workout story card
          </Text>
          
          <View style={styles.previewStats}>
            <View style={styles.previewStatItem}>
              <Text style={styles.previewStatValue}>{stats.duration}</Text>
              <Text style={styles.previewStatLabel}>Duration</Text>
            </View>
            <View style={styles.previewStatDivider} />
            <View style={styles.previewStatItem}>
              <Text style={styles.previewStatValue}>{stats.volume}kg</Text>
              <Text style={styles.previewStatLabel}>Volume</Text>
            </View>
            <View style={styles.previewStatDivider} />
            <View style={styles.previewStatItem}>
              <Text style={styles.previewStatValue}>{stats.exercises}</Text>
              <Text style={styles.previewStatLabel}>Exercises</Text>
            </View>
          </View>
          
          <View style={styles.noPhotoButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={takeSelfie}>
              <LinearGradient
                colors={['#FF8535', '#FF6B1A']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="camera" size={normalize(24)} color="#FFF" />
                <Text style={styles.primaryButtonText}>Take Selfie</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={normalize(22)} color="#FF8535" />
              <Text style={styles.secondaryButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.inspiredText}>Inspired by Strava 🏃‍♂️</Text>
        </Animated.View>
      )}

      {!hideControls && (
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.topButton}
            onPress={() => navigation.replace('Workout')}
          >
            <View style={styles.topButtonInner}>
              <Ionicons name="close" size={normalize(26)} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          {selfieUri && (
            <View style={styles.topButtonGroup}>
              <TouchableOpacity 
                style={styles.topButton}
                onPress={cycleCardStyle}
              >
                <View style={styles.topButtonInner}>
                  <Ionicons name="color-palette" size={normalize(24)} color="#FFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.styleIndicator}>
                <Text style={styles.styleIndicatorText}>{getStyleName()}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {!hideControls && selfieUri && editMode && (
        <Animated.View 
          style={[
            styles.editControls,
            { opacity: fadeAnim, height: normalize(90) } 
          ]}
        >
          <View style={styles.editControlsHandle} />
          
          <View style={styles.editHintContainer}>
            <Ionicons name="hand-left" size={normalize(16)} color="#FF8535" />
            <Text style={styles.editHint}>Drag card to reposition. Tap 'Done' to finish.</Text>
          </View>
        </Animated.View>
      )}

      {!hideControls && (
        <View style={styles.bottomActions}>
          <View style={styles.bottomActionsInner}>
            {selfieUri && (
              <TouchableOpacity 
                style={styles.bottomButton}
                onPress={() => setEditMode(!editMode)}
              >
                <View style={[
                  styles.bottomButtonCircle,
                  editMode && styles.bottomButtonCircleActive
                ]}>
                  <Ionicons 
                    name={editMode ? "checkmark" : "move"} 
                    size={normalize(24)} 
                    color={editMode ? "#10B981" : "#FFF"} 
                  />
                </View>
                <Text style={styles.bottomButtonText}>
                  {editMode ? 'Done' : 'Edit'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={handlePhotoOptions}
            >
              <View style={styles.bottomButtonCircle}>
                <Ionicons 
                  name={selfieUri ? "image" : "camera-outline"} 
                  size={normalize(24)} 
                  color="#FFF" 
                />
              </View>
              <Text style={styles.bottomButtonText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.shareButtonContainer,
                !selfieUri && styles.shareButtonDisabled
              ]}
              onPress={captureAndShare}
              disabled={!selfieUri}
            >
              <LinearGradient
                colors={['#FF8535', '#FF6B1A']}
                style={styles.shareButton}
              >
                <Ionicons 
                  name="paper-plane" 
                  size={normalize(24)} 
                  color="#FFF" 
                />
                <Text style={styles.shareButtonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkoutDetails;