import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated as RNAnimated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Vibration,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import styles, { COLORS } from './ExerciseItemStyle';
import { normalize } from '../../../../shared/hooks/useResponsive';

const SET_OPTIONS = [1, 2, 3, 4, 5];
const REP_RANGE_OPTIONS = [
  { label: '5-8', value: '5-8' },
  { label: '8-12', value: '8-12' },
  { label: '12-15', value: '12-15' },
];

const REST_TIME_OPTIONS = [
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '4m', value: 240 },
  { label: '5m', value: 300 },
];

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 500;

const NATIVE_ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.inOut(Easing.ease),
  useNativeDriver: true,
};

const BUTTON_HIT_SLOP = { top: 10, right: 10, bottom: 10, left: 10 };

const runAnimation = (anim, toValue, customConfig = {}) => {
  const config = customConfig.useNativeDriver !== undefined 
    ? { ...customConfig } 
    : { ...NATIVE_ANIMATION_CONFIG, ...customConfig };
    
  return RNAnimated.timing(anim, {
    toValue,
    ...config,
  }).start();
};

const formatRestTime = (seconds) => {
  if (!seconds) return '3m';
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = seconds / 60;
  
  if (seconds % 60 === 0) {
    return `${Math.floor(minutes)}m`;
  }
  
  if (seconds % 30 === 0) {
    return `${minutes}m`;
  }
  
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = seconds % 60;
  
  if (wholeMinutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${wholeMinutes}m ${remainingSeconds}s`;
};

const convertMinutesToSeconds = (input) => {
  const numValue = parseFloat(input);
  if (isNaN(numValue) || numValue <= 0) return null;
  
  return Math.round(numValue * 60);
};

const CustomButton = ({
  onPress,
  style,
  icon,
  accessibilityLabel,
  children,
  activeOpacity = 0.7,
  hitSlop = BUTTON_HIT_SLOP,
}) => (
  <TouchableOpacity
    style={style}
    onPress={onPress}
    activeOpacity={activeOpacity}
    hitSlop={hitSlop}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
  >
    {icon || children}
  </TouchableOpacity>
);

const ModalWrapper = ({
  visible,
  onClose,
  title,
  value,
  onChange,
  onSave,
  placeholder,
  keyboardType = 'default',
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TextInput
              style={styles.modalInput}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              keyboardType={keyboardType}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <CustomButton onPress={onClose} style={styles.modalButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </CustomButton>
              <CustomButton
                onPress={onSave}
                style={[styles.modalButton, styles.primaryButton]}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </CustomButton>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const Chip = ({ label, isSelected, onPress, size = 'default' }) => (
  <CustomButton
    onPress={onPress}
    style={[
      styles.chip, 
      isSelected && styles.selectedChip,
      size === 'small' && styles.smallChip
    ]}
    activeOpacity={0.6}
  >
    <Text style={[
      styles.chipText, 
      isSelected && styles.selectedChipText,
      size === 'small' && styles.smallChipText
    ]}>
      {label}
    </Text>
  </CustomButton>
);

const RestTimeSelector = ({ selectedValue, onSelect, onCustomPress, hasUserSelection = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new RNAnimated.Value(0)).current;
  const opacityAnim = useRef(new RNAnimated.Value(0)).current;

  const isSelectedTime = selectedValue !== undefined && selectedValue !== null;
  const isCustomRestTime = selectedValue && !REST_TIME_OPTIONS.some(opt => opt.value === selectedValue);

  const toggleExpansion = useCallback(() => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);

    RNAnimated.parallel([
      RNAnimated.timing(expandAnim, {
        toValue: newValue ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacityAnim, {
        toValue: newValue ? 1 : 0,
        duration: newValue ? 300 : 150,
        delay: newValue ? 100 : 0,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!newValue) {
        setIsExpanded(false);
      }
    });

    if (Platform.OS === 'ios') {
      try {
        Vibration.vibrate(newValue ? 5 : 3);
      } catch (error) {
      }
    }
  }, [isExpanded, expandAnim, opacityAnim]);

  const handleSelect = useCallback((value) => {
    onSelect(value);
    
    RNAnimated.parallel([
      RNAnimated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      RNAnimated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(false);
    });

    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  }, [onSelect, expandAnim, opacityAnim]);

  const handleCustomPress = useCallback(() => {
    onCustomPress();
    
    RNAnimated.parallel([
      RNAnimated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      RNAnimated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(false);
    });
  }, [onCustomPress, expandAnim, opacityAnim]);

  const handleOutsidePress = useCallback(() => {
    if (isExpanded) {
      RNAnimated.parallel([
        RNAnimated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsExpanded(false);
      });
    }
  }, [isExpanded, expandAnim, opacityAnim]);

  const chevronRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const scaleY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const isChipHighlighted = isExpanded || isSelectedTime;

  return (
    <View style={[styles.inlineRestSelector, { position: 'relative', zIndex: 1000 }]}>
      {isExpanded && (
        <TouchableWithoutFeedback
          onPress={handleOutsidePress}
          accessibilityLabel="Close rest time selector"
          accessibilityRole="button"
        >
          <View style={{
            position: 'absolute',
            top: -1000,
            left: -1000,
            right: -1000,
            bottom: -1000,
            backgroundColor: 'transparent',
            zIndex: 999,
          }} />
        </TouchableWithoutFeedback>
      )}

      <TouchableOpacity
        onPress={toggleExpansion}
        style={[
          styles.restTimeChip,
          isChipHighlighted && styles.selectedChip,
        ]}
        activeOpacity={0.7}
        accessibilityLabel={`Rest time, currently ${formatRestTime(selectedValue)}`}
        accessibilityState={{ expanded: isExpanded }}
        hitSlop={BUTTON_HIT_SLOP}
      >
        <Text style={[
          styles.chipText,
          styles.restTimeChipText,
          isChipHighlighted && styles.selectedChipText,
        ]}>
          {formatRestTime(selectedValue)}
        </Text>
        <RNAnimated.View style={{ 
          transform: [{ rotate: chevronRotation }], 
          marginLeft: normalize(4) 
        }}>
          <Ionicons
            name="chevron-down"
            size={12}
            color={isChipHighlighted ? COLORS.secondary : COLORS.textMuted}
          />
        </RNAnimated.View>
      </TouchableOpacity>

      <RNAnimated.View
        style={[
          styles.expandedRestOptions,
          {
            position: 'absolute',
            top: normalize(32),
            right: 0,
            zIndex: 1000,
            opacity: opacityAnim,
            transform: [{ scaleY }],
            transformOrigin: 'top',
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={styles.restOptionsRow}>
          {REST_TIME_OPTIONS.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <TouchableOpacity
                key={`rest-${option.value}`}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.restOptionChip,
                  isSelected && styles.selectedChip,
                ]}
                activeOpacity={0.7}
                accessibilityLabel={`Select ${option.label} rest time`}
              >
                <Text style={[
                  styles.restOptionText,
                  isSelected && styles.selectedChipText,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.restActionsRow}>
          <TouchableOpacity
            onPress={handleCustomPress}
            style={[
              styles.restActionChip,
              isCustomRestTime && styles.selectedChip,
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Set custom rest time"
          >
            <Ionicons
              name="create-outline"
              size={12}
              color={isCustomRestTime ? COLORS.secondary : COLORS.textMuted}
              style={styles.actionIcon}
            />
            <Text style={[
              styles.restActionText,
              isCustomRestTime && styles.selectedChipText,
            ]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    </View>
  );
};

const ExerciseItem = React.memo(
  ({ exercise, index, onSetsChange, onRepsChange, onNoteChange, onRestBetweenSetsChange, onDelete, onReplace, fadeAnim }) => {
    const [showDetails, setShowDetails] = useState(index === 0);
    const [modalState, setModalState] = useState({
      customRep: { visible: false, value: exercise?.repRange || '' },
      customRest: { 
        visible: false, 
        value: exercise?.restTime ? (exercise.restTime / 60).toString() : ''
      },
    });

    const [swipeState, setSwipeState] = useState('idle');

    const iconAnim = useRef(new RNAnimated.Value(index === 0 ? 1.2 : 1)).current;
    const iconRotation = useRef(new RNAnimated.Value(index === 0 ? 0 : 1)).current;
    const detailsOpacity = useRef(new RNAnimated.Value(index === 0 ? 1 : 0)).current;
    const detailsTranslateY = useRef(new RNAnimated.Value(index === 0 ? 0 : -20)).current;
    const buttonsOpacity = useRef(new RNAnimated.Value(index === 0 ? 1 : 0)).current;
    
    const swipeTranslateX = useRef(new RNAnimated.Value(0)).current;
    const swipeOpacity = useRef(new RNAnimated.Value(1)).current;
    const backgroundColorAnim = useRef(new RNAnimated.Value(0)).current;
    const cardPulse = useRef(new RNAnimated.Value(1)).current;

    const exerciseName = exercise?.exerciseName || exercise?.name || '';
    const muscleGroup = exercise?.muscleGroup || '';
    const isCustomRepRange =
      exercise?.repRange && !REP_RANGE_OPTIONS.some((opt) => opt.value === exercise.repRange);

    useEffect(() => {
      if (exercise.restTime === undefined) {
        onRestBetweenSetsChange(180, index);
      }
    }, [exercise.restTime, onRestBetweenSetsChange, index]);

    const toggleDetails = useCallback(() => {
      LayoutAnimation.configureNext({
        duration: 300,
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
      });
      
      const newValue = !showDetails;
      setShowDetails(newValue);
      
      runAnimation(iconAnim, newValue ? 1.2 : 1, { duration: 150 });
      runAnimation(iconRotation, newValue ? 0 : 1, { duration: 150 });
      runAnimation(detailsOpacity, newValue ? 1 : 0, { duration: 300 });
      runAnimation(detailsTranslateY, newValue ? 0 : -20, { duration: 300 });
      runAnimation(buttonsOpacity, newValue ? 1 : 0, {
        delay: newValue ? 150 : 0,
        duration: 200,
      });
      
      if (Platform.OS === 'ios') {
        Vibration.vibrate(5);
      }
    }, [showDetails]);

    const handleModalChange = useCallback((modal, field, value) => {
      setModalState((prev) => ({
        ...prev,
        [modal]: { ...prev[modal], [field]: value },
      }));
    }, []);

    const saveRepModal = useCallback(() => {
      const { value } = modalState.customRep;
      if (value.trim()) {
        onRepsChange(value.trim(), index);
      }
      handleModalChange('customRep', 'visible', false);
    }, [modalState.customRep.value, onRepsChange, index]);

    const saveRestModal = useCallback(() => {
      const { value } = modalState.customRest;
      const seconds = convertMinutesToSeconds(value.trim());
      if (seconds !== null) {
        onRestBetweenSetsChange(seconds, index);
      }
      handleModalChange('customRest', 'visible', false);
    }, [modalState.customRest.value, onRestBetweenSetsChange, index]);

    const handleRestTimeSelect = useCallback((restTime) => {
      onRestBetweenSetsChange(restTime, index);
    }, [onRestBetweenSetsChange, index]);

    const handleCustomRestPress = useCallback(() => {
      const currentMinutes = exercise?.restTime ? (exercise.restTime / 60).toString() : '';
      setModalState(prev => ({
        ...prev,
        customRest: {
          ...prev.customRest,
          value: currentMinutes,
          visible: true
        }
      }));
    }, [exercise?.restTime]);

    const resetSwipe = useCallback(() => {
      setSwipeState('idle');
      RNAnimated.parallel([
        RNAnimated.timing(swipeTranslateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backgroundColorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }, []);

    const handleReplace = useCallback(() => {
      setSwipeState('replace');
      
      RNAnimated.parallel([
        RNAnimated.timing(swipeTranslateX, {
          toValue: 200,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backgroundColorAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        RNAnimated.sequence([
          RNAnimated.timing(cardPulse, {
            toValue: 1.02,
            duration: 100,
            useNativeDriver: true,
          }),
          RNAnimated.timing(cardPulse, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onReplace(index);
        resetSwipe();
        Vibration.vibrate(20);
      });
    }, [index, onReplace]);

    const handleDelete = useCallback(() => {
      setSwipeState('delete');
      
      RNAnimated.parallel([
        RNAnimated.timing(swipeTranslateX, {
          toValue: -200,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backgroundColorAnim, {
          toValue: -1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        RNAnimated.timing(swipeOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete(index);
          Vibration.vibrate(40);
        });
      });
    }, [index, onDelete]);

    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-20, 20])
      .onUpdate((event) => {
        swipeTranslateX.setValue(event.translationX);
        const colorValue = event.translationX > 0 ? 1 : event.translationX < 0 ? -1 : 0;
        backgroundColorAnim.setValue(colorValue);
        setSwipeState('swiping');
      })
      .onEnd((event) => {
        const shouldTriggerAction = 
          Math.abs(event.translationX) > SWIPE_THRESHOLD || 
          Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;

        if (shouldTriggerAction) {
          if (event.translationX > 0) {
            handleReplace();
          } else {
            handleDelete();
          }
        } else {
          resetSwipe();
        }
      });

    useEffect(() => {
      runAnimation(buttonsOpacity, showDetails ? 1 : 0, {
        delay: showDetails ? 150 : 0,
        duration: 200,
      });
    }, [showDetails]);

    const iconRotationInterpolate = iconRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    });

    const backgroundColorInterpolate = backgroundColorAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [COLORS.error || '#FF4444', 'transparent', COLORS.primary || '#FF8C00'],
      extrapolate: 'clamp',
    });

    const animatedIconStyle = {
      transform: [
        { scale: iconAnim },
        { rotate: iconRotationInterpolate },
      ],
    };

    const animatedDetailsStyle = {
      opacity: detailsOpacity,
      transform: [{ translateY: detailsTranslateY }],
    };

    const animatedCardStyle = {
      opacity: swipeOpacity,
      transform: [
        { translateX: swipeTranslateX },
        { scale: cardPulse },
      ],
    };

    const animatedBackgroundStyle = {
      backgroundColor: backgroundColorInterpolate,
    };

    if (!exercise) return null;

    return (
      <View style={styles.exerciseItemContainer}>
        <RNAnimated.View style={[styles.swipeBackground, animatedBackgroundStyle]} />
        
        <GestureDetector gesture={panGesture}>
          <RNAnimated.View
            style={[
              styles.exerciseCard,
              showDetails && styles.cardExpanded,
              animatedCardStyle,
              { opacity: fadeAnim || 1 },
            ]}
          >
            <View style={styles.exerciseHeader}>
              <CustomButton
                onPress={toggleDetails}
                style={styles.exerciseHeaderButton}
                activeOpacity={0.9}
              >
                <View style={styles.imageContainer}>
                  {exercise.imageURL ? (
                    <Image
                      source={{ uri: exercise.imageURL }}
                      style={styles.exerciseImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.exerciseImage}>
                      <Ionicons name="barbell" size={20} color={COLORS.textMuted} />
                    </View>
                  )}
                </View>
                <View style={styles.exerciseTextContainer}>
                  <View style={styles.nameAndSetsContainer}>
                    <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                      {exerciseName}
                    </Text>
                  </View>
                  {(exercise.numSets || exercise.repRange || muscleGroup) && (
                    <View style={styles.setsRepsSummary}>
                      {(exercise.numSets || exercise.repRange) && (
                        <Text style={styles.setsRepsText}>
                          {exercise.numSets && exercise.repRange
                            ? `${exercise.numSets} x ${exercise.repRange}`
                            : exercise.numSets
                            ? `${exercise.numSets} sets`
                            : exercise.repRange
                            ? `${exercise.repRange} reps`
                            : ''}
                        </Text>
                      )}
                      {muscleGroup && (exercise.numSets || exercise.repRange) && (
                        <View style={styles.circleSeparator} />
                      )}
                      {muscleGroup && <Text style={styles.setsRepsText}>{muscleGroup}</Text>}
                    </View>
                  )}
                </View>
              </CustomButton>
              
              <View style={styles.headerButtonsContainer}>
                <CustomButton
                  onPress={toggleDetails}
                  style={styles.collapseButton}
                  icon={
                    <RNAnimated.View style={animatedIconStyle}>
                      <Ionicons
                        name={showDetails ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={COLORS.text}
                      />
                    </RNAnimated.View>
                  }
                />
              </View>
            </View>

            {showDetails && (
              <RNAnimated.View
                style={[styles.detailsContainer, animatedDetailsStyle, styles.detailsContainerPadding]}
              >
                <View>
                  <View style={styles.detailRow}>
                    <View style={styles.setsAndRestRow}>
                      <View style={styles.setsSection}>
                        <Text style={styles.detailLabel}>SETS</Text>
                        <View style={styles.chipsContainer}>
                          {SET_OPTIONS.map((setNum) => (
                            <Chip
                              key={`set-${setNum}`}
                              label={setNum.toString()}
                              isSelected={Number(exercise.numSets) === setNum}
                              onPress={() => onSetsChange(setNum.toString(), index)}
                            />
                          ))}
                        </View>
                      </View>

                      <View style={styles.restSection}>
                        <Text style={styles.detailLabel}>REST </Text>
                        <RestTimeSelector
                          selectedValue={exercise.restTime}
                          onSelect={handleRestTimeSelect}
                          onCustomPress={handleCustomRestPress}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>REP RANGE</Text>
                    <View style={styles.chipsContainer}>
                      {REP_RANGE_OPTIONS.map((option) => (
                        <Chip
                          key={`rep-${option.value}`}
                          label={option.label}
                          isSelected={exercise.repRange === option.value}
                          onPress={() => onRepsChange(option.value, index)}
                        />
                      ))}
                      <Chip
                        label={isCustomRepRange ? exercise.repRange : 'Custom'}
                        isSelected={isCustomRepRange}
                        onPress={() => handleModalChange('customRep', 'visible', true)}
                      />
                    </View>
                  </View>

                  <View style={styles.noteContainer}>
                    <Text style={styles.detailLabel}>NOTE</Text>
                    <View style={styles.noteRow}>
                      <TextInput
                        style={styles.noteTextInput}
                        value={exercise.note || ''}
                        onChangeText={(text) => onNoteChange(text, index)}
                        placeholder="Add notes for this exercise..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </View>
              </RNAnimated.View>
            )}
          </RNAnimated.View>
        </GestureDetector>

        <ModalWrapper
          visible={modalState.customRep.visible}
          onClose={() => handleModalChange('customRep', 'visible', false)}
          title="Custom Rep Range"
          value={modalState.customRep.value}
          onChange={(text) => handleModalChange('customRep', 'value', text)}
          onSave={saveRepModal}
          placeholder="e.g. 6-10"
        />

        <ModalWrapper
          visible={modalState.customRest.visible}
          onClose={() => handleModalChange('customRest', 'visible', false)}
          title="Custom Rest Time"
          value={modalState.customRest.value}
          onChange={(text) => handleModalChange('customRest', 'value', text)}
          onSave={saveRestModal}
          placeholder="e.g. 1.5 (minutes)"
          keyboardType="numeric"
        />
      </View>
    );
  }
);

export default ExerciseItem;