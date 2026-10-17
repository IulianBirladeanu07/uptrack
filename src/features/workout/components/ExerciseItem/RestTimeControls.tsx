import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles, { COLORS } from './ExerciseItemStyle';
import { BUTTON_HIT_SLOP, CustomButton } from './ExerciseItemControls';
import {
  REST_TIME_OPTIONS,
  formatRestTime,
  isCustomRestTime as hasCustomRestTime,
  sanitizeTimeInput,
  isValidSecondsInput,
  getRestInputs,
  getTotalRestSeconds,
} from './exerciseItemUtils';
import { normalize } from '../../../../shared/hooks/useResponsive';

type RestTimeModalProps = {
  visible: boolean;
  onClose: () => void;
  currentValue?: number | undefined;
  onSave: (seconds: number) => void;
};

export const RestTimeModal = ({ visible, onClose, currentValue, onSave }: RestTimeModalProps) => {
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

type RestTimeSelectorProps = {
  selectedValue?: number | undefined;
  onSelect: (value: number) => void;
  onCustomPress: () => void;
};

export const RestTimeSelector = ({ selectedValue, onSelect, onCustomPress }: RestTimeSelectorProps) => {
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
