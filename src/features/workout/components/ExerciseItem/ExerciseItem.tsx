import { useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
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
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { COLORS } from './ExerciseItemStyle';
import { CustomButton, ModalWrapper, Chip } from './ExerciseItemControls';
import { RestTimeModal, RestTimeSelector } from './RestTimeControls';
import {
  SET_OPTIONS,
  REP_RANGE_OPTIONS,
  isCustomRepRange as hasCustomRepRange,
  getSetsRepsLabel,
  getExerciseSwipeAction,
} from './exerciseItemUtils';
import type { TemplateExercise } from '../../types';

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
        const swipeAction = getExerciseSwipeAction(event.translationX);
        if (swipeAction === 'replace') {
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
        } else if (swipeAction === 'delete') {
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