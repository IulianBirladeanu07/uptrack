import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Vibration,
  Platform,
  LayoutAnimation,
  PanResponder,
} from 'react-native';
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
    
  return Animated.timing(anim, {
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

const RestTimeModal = ({ visible, onClose, currentValue, onSave }) => {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    if (visible && currentValue) {
      const m = Math.floor(currentValue / 60);
      const s = currentValue % 60;
      setMinutes(m > 0 ? m.toString() : '');
      setSeconds(s > 0 ? s.toString() : '');
    }
  }, [visible, currentValue]);

  const handleMinutesChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMinutes(cleaned);
  };

  const handleSecondsChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    if (num <= 59) {
      setSeconds(cleaned);
    }
  };

  const handleSave = () => {
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const totalSeconds = m * 60 + s;
    if (totalSeconds > 0) {
      onSave(totalSeconds);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Custom Rest Time</Text>
              
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={minutes}
                    onChangeText={handleMinutesChange}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>min</Text>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={seconds}
                    onChangeText={handleSecondsChange}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>sec</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <CustomButton onPress={onClose} style={styles.modalButton}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </CustomButton>
                <CustomButton
                  onPress={handleSave}
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
};

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
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isSelectedTime = selectedValue !== undefined && selectedValue !== null;
  const isCustomRestTime = selectedValue && !REST_TIME_OPTIONS.some(opt => opt.value === selectedValue);

  const toggleExpansion = useCallback(() => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);

    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: newValue ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
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
      } catch (error) {}
    }
  }, [isExpanded, expandAnim, opacityAnim]);

  const handleSelect = useCallback((value) => {
    onSelect(value);
    
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => setIsExpanded(false));

    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  }, [onSelect, expandAnim, opacityAnim]);

  const handleCustomPress = useCallback(() => {
    onCustomPress();
    
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => setIsExpanded(false));
  }, [onCustomPress, expandAnim, opacityAnim]);

  const handleOutsidePress = useCallback(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setIsExpanded(false));
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
    <View style={styles.inlineRestSelector}>
      {isExpanded && (
        <TouchableWithoutFeedback
          onPress={handleOutsidePress}
          accessibilityLabel="Close rest time selector"
          accessibilityRole="button"
        >
          <View style={styles.restSelectorBackdrop} />
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
        <Animated.View style={{ 
          transform: [{ rotate: chevronRotation }], 
          marginLeft: normalize(4) 
        }}>
          <Ionicons
            name="chevron-down"
            size={12}
            color={isChipHighlighted ? COLORS.secondary : COLORS.textMuted}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.expandedRestOptions,
          {
            opacity: opacityAnim,
            transform: [{ scaleY }],
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
      </Animated.View>
    </View>
  );
};

const ExerciseItem = React.memo(
  ({ exercise, index, onSetsChange, onRepsChange, onNoteChange, onRestBetweenSetsChange, onDelete, onReplace, fadeAnim }) => {
    const [showDetails, setShowDetails] = useState(index === 0);
    const [modalState, setModalState] = useState({
      customRep: { visible: false, value: exercise?.repRange || '' },
      customRest: { visible: false },
    });

    console.log('Rendering ExerciseItem:', exercise?.exerciseName || exercise?.name, 'at index', index);
console.log("exercise image URL:", exercise?.imageURL);

    const iconAnim = useRef(new Animated.Value(index === 0 ? 1.2 : 1)).current;
    const iconRotation = useRef(new Animated.Value(index === 0 ? 0 : 1)).current;
    const detailsOpacity = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;
    const detailsTranslateY = useRef(new Animated.Value(index === 0 ? 0 : -20)).current;
    const buttonsOpacity = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;
    
    const swipeTranslateX = useRef(new Animated.Value(0)).current;
    const swipeOpacity = useRef(new Animated.Value(1)).current;
    const backgroundColorAnim = useRef(new Animated.Value(0)).current;

    const exerciseName = exercise?.exerciseName || exercise?.name || '';
    const muscleGroup = exercise?.muscleGroup || '';
    const isCustomRepRange =
      exercise?.repRange && !REP_RANGE_OPTIONS.some((opt) => opt.value === exercise.repRange);

    useEffect(() => {
      if (exercise.restTime === undefined) {
        onRestBetweenSetsChange(180, index);
      }
    }, [exercise.restTime, onRestBetweenSetsChange, index]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
        },
        onPanResponderMove: (_, gestureState) => {
          swipeTranslateX.setValue(gestureState.dx);
          const colorValue = gestureState.dx > 0 ? 1 : gestureState.dx < 0 ? -1 : 0;
          backgroundColorAnim.setValue(colorValue);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
            if (gestureState.dx > 0) {
              Animated.parallel([
                Animated.timing(swipeTranslateX, {
                  toValue: 200,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(backgroundColorAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                onReplace(index);
                swipeTranslateX.setValue(0);
                backgroundColorAnim.setValue(0);
                Vibration.vibrate(20);
              });
            } else {
              Animated.parallel([
                Animated.timing(swipeTranslateX, {
                  toValue: -200,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(backgroundColorAnim, {
                  toValue: -1,
                  duration: 200,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                Animated.timing(swipeOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  onDelete(index);
                  Vibration.vibrate(40);
                });
              });
            }
          } else {
            Animated.parallel([
              Animated.timing(swipeTranslateX, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(backgroundColorAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
          }
        },
      })
    ).current;

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
    }, [showDetails, iconAnim, iconRotation, detailsOpacity, detailsTranslateY, buttonsOpacity]);

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
    }, [modalState.customRep.value, onRepsChange, index, handleModalChange]);

    const handleRestTimeSelect = useCallback((restTime) => {
      onRestBetweenSetsChange(restTime, index);
    }, [onRestBetweenSetsChange, index]);

    const handleCustomRestPress = useCallback(() => {
      setModalState(prev => ({
        ...prev,
        customRest: {
          visible: true
        }
      }));
    }, []);

    const handleRestTimeSave = useCallback((totalSeconds) => {
      onRestBetweenSetsChange(totalSeconds, index);
    }, [onRestBetweenSetsChange, index]);

    useEffect(() => {
      runAnimation(buttonsOpacity, showDetails ? 1 : 0, {
        delay: showDetails ? 150 : 0,
        duration: 200,
      });
    }, [showDetails, buttonsOpacity]);

    const iconRotationInterpolate = iconRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    });

    const backgroundColorInterpolate = backgroundColorAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [COLORS.error, COLORS.transparent, COLORS.primary],
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
      transform: [{ translateX: swipeTranslateX }],
    };

    const animatedBackgroundStyle = {
      backgroundColor: backgroundColorInterpolate,
    };

    if (!exercise) return null;

    return (
      <View style={styles.exerciseItemContainer}>
        <Animated.View style={[styles.swipeBackground, animatedBackgroundStyle]} />
        
        <Animated.View
          {...panResponder.panHandlers}
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
                  <Animated.View style={animatedIconStyle}>
                    <Ionicons
                      name={showDetails ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={COLORS.textSecondary}
                    />
                  </Animated.View>
                }
              />
            </View>
          </View>

          {showDetails && (
            <Animated.View
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
            </Animated.View>
          )}
        </Animated.View>

        <ModalWrapper
          visible={modalState.customRep.visible}
          onClose={() => handleModalChange('customRep', 'visible', false)}
          title="Custom Rep Range"
          value={modalState.customRep.value}
          onChange={(text) => handleModalChange('customRep', 'value', text)}
          onSave={saveRepModal}
          placeholder="e.g. 6-10"
        />

        <RestTimeModal
          visible={modalState.customRest.visible}
          onClose={() => handleModalChange('customRest', 'visible', false)}
          currentValue={exercise?.restTime}
          onSave={handleRestTimeSave}
        />
      </View>
    );
  }
);

export default ExerciseItem;