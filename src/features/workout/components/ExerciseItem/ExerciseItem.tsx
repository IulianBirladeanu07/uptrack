import { useState, useRef, useCallback, useEffect, memo, type ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  type TouchableOpacityProps,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Vibration,
  Platform,
} from 'react-native';
import Reanimated, {
  LinearTransition,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import styles, { COLORS } from './ExerciseItemStyle';
import {
  SET_OPTIONS,
  REP_RANGE_OPTIONS,
  REST_TIME_OPTIONS,
  formatRestTime,
  isCustomRepRange as hasCustomRepRange,
  isCustomRestTime as hasCustomRestTime,
  getSetsRepsLabel,
  sanitizeTimeInput,
  isValidSecondsInput,
  getRestInputs,
  getTotalRestSeconds,
} from './exerciseItemUtils';
import { normalize } from '../../../../shared/hooks/useResponsive';
import type { TemplateExercise } from '../../types';

const SWIPE_THRESHOLD = 60;

const BUTTON_HIT_SLOP = { top: 10, right: 10, bottom: 10, left: 10 };

type CustomButtonProps = Pick<
  TouchableOpacityProps,
  'onPress' | 'onPressIn' | 'onLongPress' | 'style' | 'accessibilityLabel' | 'activeOpacity' | 'hitSlop' | 'disabled'
> & {
  icon?: ReactNode;
  children?: ReactNode;
};

const CustomButton = ({
  onPress,
  onPressIn,
  onLongPress,
  style,
  icon,
  accessibilityLabel,
  children,
  activeOpacity = 0.7,
  hitSlop = BUTTON_HIT_SLOP,
  disabled = false,
}: CustomButtonProps) => (
  <TouchableOpacity
    style={style}
    onPress={onPress}
    onPressIn={onPressIn}
    onLongPress={onLongPress}
    activeOpacity={activeOpacity}
    hitSlop={hitSlop}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    disabled={disabled}
  >
    {icon || children}
  </TouchableOpacity>
);

type ModalWrapperProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder: string;
  keyboardType?: TextInputProps['keyboardType'];
};

const ModalWrapper = ({
  visible,
  onClose,
  title,
  value,
  onChange,
  onSave,
  placeholder,
  keyboardType = 'default',
}: ModalWrapperProps) => (
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

type RestTimeModalProps = {
  visible: boolean;
  onClose: () => void;
  currentValue?: number | undefined;
  onSave: (seconds: number) => void;
};

const RestTimeModal = ({ visible, onClose, currentValue, onSave }: RestTimeModalProps) => {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    if (visible && currentValue) {
      const inputs = getRestInputs(currentValue);
      setMinutes(inputs.minutes);
      setSeconds(inputs.seconds);
    }
  }, [visible, currentValue]);

  const handleMinutesChange = (text: string) => {
    setMinutes(sanitizeTimeInput(text));
  };

  const handleSecondsChange = (text: string) => {
    const cleaned = sanitizeTimeInput(text);
    if (isValidSecondsInput(cleaned)) {
      setSeconds(cleaned);
    }
  };

  const handleSave = () => {
    const totalSeconds = getTotalRestSeconds(minutes, seconds);
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

type ChipProps = {
  label: string | undefined;
  isSelected: boolean | undefined;
  onPress: () => void;
  size?: 'default' | 'small';
};

const Chip = ({ label, isSelected, onPress, size = 'default' }: ChipProps) => (
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

type RestTimeSelectorProps = {
  selectedValue?: number | undefined;
  onSelect: (value: number) => void;
  onCustomPress: () => void;
};

const RestTimeSelector = ({ selectedValue, onSelect, onCustomPress }: RestTimeSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isSelectedTime = selectedValue !== undefined && selectedValue !== null;
  const isCustomRestTime = hasCustomRestTime(selectedValue);

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

  const handleSelect = useCallback((value: number) => {
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

const areEqual = (prevProps: ExerciseItemProps, nextProps: ExerciseItemProps) => {
  return (
    prevProps.exercise === nextProps.exercise &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.fadeAnim === nextProps.fadeAnim &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.onDrag === nextProps.onDrag &&
    prevProps.onSetsChange === nextProps.onSetsChange &&
    prevProps.onRepsChange === nextProps.onRepsChange &&
    prevProps.onNoteChange === nextProps.onNoteChange &&
    prevProps.onRestBetweenSetsChange === nextProps.onRestBetweenSetsChange &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onReplace === nextProps.onReplace
  );
};

type ExerciseItemData = TemplateExercise & { id: string };

type ExerciseItemProps = {
  exercise: ExerciseItemData;
  isExpanded?: boolean;
  onToggle: (id: string) => void;
  onSetsChange: (sets: number | string, id: string) => void;
  onRepsChange: (reps: string, id: string) => void;
  onNoteChange: (note: string, id: string) => void;
  onRestBetweenSetsChange: (rest: number, id: string) => void;
  onDelete: (id: string) => void;
  onReplace?: (id: string) => void;
  fadeAnim?: Animated.Value;
  onDrag?: () => void;
  isDragging?: boolean;
};

const ExerciseItem = memo(
  ({ exercise, isExpanded, onToggle, onSetsChange, onRepsChange, onNoteChange, onRestBetweenSetsChange, onDelete, onReplace, onDrag, isDragging }: ExerciseItemProps) => {
    const [modalState, setModalState] = useState({
      customRep: { visible: false, value: exercise?.repRange || '' },
      customRest: { visible: false },
    });

    const swipeTranslateX = useSharedValue(0);
    const swipeOpacity = useSharedValue(1);
    const swipeProgress = useSharedValue(0);

    const exerciseName = exercise?.exerciseName || exercise?.name || '';
    const muscleGroup = exercise?.muscleGroup || '';
    const isCustomRepRange = hasCustomRepRange(exercise?.repRange);

    useEffect(() => {
      if (exercise.restTime === undefined) {
        onRestBetweenSetsChange(180, exercise.id);
      }
    }, [exercise.restTime, exercise.id, onRestBetweenSetsChange]);

    const panGesture = Gesture.Pan()
      .enabled(!isDragging)
      .activeOffsetX([-10, 10])
      .failOffsetY([-20, 20])
      .onUpdate((event) => {
        swipeTranslateX.value = event.translationX;
        swipeProgress.value = event.translationX > 0 ? 1 : event.translationX < 0 ? -1 : 0;
      })
      .onEnd((event) => {
        if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
          if (event.translationX > 0) {
            swipeTranslateX.value = withTiming(200, { duration: 200 }, (finished) => {
              if (finished) {
                swipeTranslateX.value = 0;
                swipeProgress.value = 0;
                if (onReplace) {
                  runOnJS(onReplace)(exercise.id);
                }
                runOnJS(Vibration.vibrate)(20);
              }
            });
            swipeProgress.value = withTiming(1, { duration: 200 });
          } else {
            swipeTranslateX.value = withTiming(-200, { duration: 200 });
            swipeProgress.value = withTiming(-1, { duration: 200 });
            swipeOpacity.value = withDelay(
              200,
              withTiming(0, { duration: 200 }, (finished) => {
                if (finished) {
                  runOnJS(onDelete)(exercise.id);
                  runOnJS(Vibration.vibrate)(40);
                }
              })
            );
          }
        } else {
          swipeTranslateX.value = withTiming(0, { duration: 200 });
          swipeProgress.value = withTiming(0, { duration: 200 });
        }
      });

    const animatedCardStyle = useAnimatedStyle(() => ({
      opacity: swipeOpacity.value,
      transform: [{ translateX: swipeTranslateX.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        swipeProgress.value,
        [-1, 0, 1],
        [COLORS.error, COLORS.transparent, COLORS.primary]
      ),
    }));

    const toggleDetails = useCallback(() => {
      onToggle(exercise.id);

      if (Platform.OS === 'ios') {
        Vibration.vibrate(5);
      }
    }, [onToggle, exercise.id]);

    const handleModalChange = useCallback((
      modal: 'customRep' | 'customRest',
      field: 'visible' | 'value',
      value: boolean | string
    ) => {
      setModalState((prev) => {
        if (modal === 'customRep') {
          if (field === 'visible' && typeof value === 'boolean') {
            return { ...prev, customRep: { ...prev.customRep, visible: value } };
          }
          if (field === 'value' && typeof value === 'string') {
            return { ...prev, customRep: { ...prev.customRep, value } };
          }
        } else if (field === 'visible' && typeof value === 'boolean') {
          return { ...prev, customRest: { visible: value } };
        }
        return prev;
      });
    }, []);

    const saveRepModal = useCallback(() => {
      const { value } = modalState.customRep;
      if (value.trim()) {
        onRepsChange(value.trim(), exercise.id);
      }
      handleModalChange('customRep', 'visible', false);
    }, [modalState.customRep.value, onRepsChange, exercise.id, handleModalChange]);

    const handleRestTimeSelect = useCallback((restTime: number) => {
      onRestBetweenSetsChange(restTime, exercise.id);
    }, [onRestBetweenSetsChange, exercise.id]);

    const handleCustomRestPress = useCallback(() => {
      setModalState(prev => ({
        ...prev,
        customRest: {
          visible: true
        }
      }));
    }, []);

    const handleRestTimeSave = useCallback((totalSeconds: number) => {
      onRestBetweenSetsChange(totalSeconds, exercise.id);
    }, [onRestBetweenSetsChange, exercise.id]);

    if (!exercise) return null;

    return (
      <View style={styles.exerciseItemContainer}>
        <Reanimated.View style={[styles.swipeBackground, animatedBackgroundStyle]} />

        <GestureDetector gesture={panGesture}>
          <Reanimated.View style={animatedCardStyle}>
            <Reanimated.View
              layout={LinearTransition.duration(300)}
              style={[
                styles.exerciseCard,
                isExpanded && styles.cardExpanded,
                isDragging && styles.draggingCard,
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
                        contentFit="cover"
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
                            {getSetsRepsLabel(exercise.numSets, exercise.repRange)}
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
                    onPressIn={onDrag}
                    disabled={!onDrag}
                    style={[styles.dragHandleButton, !onDrag && styles.dragHandleButtonDisabled]}
                    icon={
                      <Ionicons
                        name="reorder-three-outline"
                        size={18}
                        color={COLORS.textSecondary}
                      />
                    }
                    accessibilityLabel="Drag to reorder exercise"
                  />
                </View>
              </View>

              {isExpanded && (
                <Reanimated.View
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(160)}
                  style={[styles.detailsContainer, styles.detailsContainerPadding]}
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
                                onPress={() => onSetsChange(setNum.toString(), exercise.id)}
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
                            onPress={() => onRepsChange(option.value, exercise.id)}
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
                          onChangeText={(text) => onNoteChange(text, exercise.id)}
                          placeholder="Add notes for this exercise..."
                          placeholderTextColor={COLORS.textMuted}
                          multiline
                          numberOfLines={2}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  </View>
                </Reanimated.View>
              )}
            </Reanimated.View>
          </Reanimated.View>
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

        <RestTimeModal
          visible={modalState.customRest.visible}
          onClose={() => handleModalChange('customRest', 'visible', false)}
          currentValue={exercise?.restTime}
          onSave={handleRestTimeSave}
        />
      </View>
    );
  },
  areEqual
);

export default ExerciseItem;  