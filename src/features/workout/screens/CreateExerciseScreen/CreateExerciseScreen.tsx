import { memo, useState, useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Easing,
  FlatList,
  InteractionManager,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles, { COLORS } from './CreateExerciseScreenStyle';
import { createCustomExercise } from '../../services/exerciseCatalogService';
import {
  EXERCISE_DATA,
  createEmptyExerciseForm,
  getFormProgress,
  validateExerciseForm,
  buildCustomExercisePayload,
  filterPickerOptions,
  type ExerciseFormData,
  type FormField,
  type FormErrors,
  type PickerType,
  type PickerOption,
} from './createExerciseForm';

type ModalPickerHandle = { focus: () => void };
type ModalPickerProps = {
  label: string;
  type: PickerType;
  selectedValue: string;
  onSelect: (value: string) => void;
  error?: string | null | undefined;
  placeholder: string;
};

const { height } = Dimensions.get('window');

const debounce = (func: (value: string) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (value: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(value), delay);
  };
};

const OptionItem = memo(({ option, isSelected, onSelect }: {
  option: PickerOption;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <View style={styles.menuItemWrapper}>
    <TouchableOpacity
      style={[
        styles.menuOption,
        isSelected && styles.optionSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={option.name}
      accessibilityHint={option.desc}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[
        styles.menuIcon,
        {
          backgroundColor: `${option.color}15`,
          borderColor: `${option.color}30`
        }
      ]}>
        <Ionicons name={option.icon} size={24} color={option.color} />
      </View>
      <View style={styles.menuText}>
        <Text style={[
          styles.menuLabel,
          isSelected && styles.optionNameSelected,
        ]}>
          {option.name}
        </Text>
        <Text style={styles.menuSublabel}>{option.desc}</Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.accentPrimary} />
        </View>
      )}
    </TouchableOpacity>
  </View>
));

const ModalPicker = forwardRef<ModalPickerHandle, ModalPickerProps>(({
  label,
  type,
  selectedValue,
  onSelect,
  error,
  placeholder,
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const slideAnim = useRef(new Animated.Value(1)).current;
  const options = EXERCISE_DATA[type];

  const filteredOptions = useMemo(
    () => filterPickerOptions(options, searchQuery),
    [options, searchQuery]
  );

  const selectedOption = useMemo(() =>
    options.find(opt => opt.name === selectedValue), [options, selectedValue]
  );

  const openModal = useCallback(() => {
    setModalVisible(true);
    setSearchQuery('');
    slideAnim.setValue(1);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  }, [slideAnim]);

  useImperativeHandle(ref, () => ({
    focus: openModal,
  }));

  const debouncedSearch = useMemo(() =>
    debounce(setSearchQuery, 100), []
  );

  const renderItem = useCallback(({ item }: { item: PickerOption }) => (
    <OptionItem
      option={item}
      isSelected={selectedValue === item.name}
      onSelect={() => {
        onSelect(item.name);
        closeModal();
      }}
    />
  ), [selectedValue, onSelect, closeModal]);

  const keyExtractor = useCallback((item: PickerOption) => item.name, []);

  const modalTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {' '}{label}
      </Text>

      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.fieldError,
          selectedValue && styles.pickerSelected,
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selectedValue || 'not selected'}`}
        accessibilityHint={`Opens a list to select ${label}`}
      >
        <View style={styles.pickerContent}>
          {selectedOption && (
            <View style={[styles.pickerIconContainer, { backgroundColor: `${selectedOption.color}15` }]}>
              <Ionicons name={selectedOption.icon} size={18} color={selectedOption.color} />
            </View>
          )}
          <Text style={[
            styles.pickerText,
            selectedValue ? styles.pickerTextSelected : styles.placeholderText,
          ]}>
            {selectedValue || placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={selectedValue ? COLORS.accentPrimary : COLORS.textTertiary}
        />
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent
        hardwareAccelerated={true}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[
            styles.modalBackdrop,
            { opacity: backdropOpacity }
          ]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: modalTransform }] }
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="list" size={20} color={COLORS.accentPrimary} />
              <Text style={styles.modalTitle}>{label}</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
              placeholderTextColor={COLORS.textMuted}
              onChangeText={debouncedSearch}
              autoCapitalize="none"
              autoFocus={false}
              blurOnSubmit={false}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredOptions}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            updateCellsBatchingPeriod={50}
            getItemLayout={(_data, index) => ({
              length: 70,
              offset: 70 * index,
              index,
            })}
            ListEmptyComponent={(
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color={COLORS.textMuted} />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          />
        </Animated.View>
      </Modal>
    </View>
  );
});

const CreateExerciseScreen = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateExercise'>();

  const [formData, setFormData] = useState<ExerciseFormData>(createEmptyExerciseForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<FormField | null>(null);

  const muscleGroupPickerRef = useRef<ModalPickerHandle | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current; 

  const progress = useMemo(() => getFormProgress(formData), [formData]);

  const isComplete = progress === 1;

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      InteractionManager.runAfterInteractions(() => {
        Animated.parallel([
          Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 150 }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }),
        ]).start();
      });
    }, [fadeAnim, slideAnim])
  );

  useEffect(() => {
    Animated.spring(progressAnim, { toValue: progress, useNativeDriver: false, damping: 20, stiffness: 200 }).start();
    Animated.spring(summaryAnim, { toValue: isComplete ? 1 : 0, useNativeDriver: true, damping: 15, stiffness: 200 }).start();
  }, [progress, isComplete, progressAnim, summaryAnim]);

  const validationErrors = useMemo(() => validateExerciseForm(formData), [formData]);

  const validateForm = useCallback(() => {
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      triggerShake();
      Alert.alert('Incomplete Form', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCustomExercise(buildCustomExercisePayload(formData));

      const { onExerciseCreated } = route.params || {};
      if (onExerciseCreated) {
        onExerciseCreated(result.exercise);
      }

      Alert.alert(
        'Success!',
        'Your custom exercise has been created.',
        [
          { text: 'Create Another', onPress: () => { setFormData(createEmptyExerciseForm()); setErrors({}); } },
          { text: 'Done', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, navigation, route.params, triggerShake]);

  const updateField = useCallback((field: FormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const progressColor = isComplete ? COLORS.success : COLORS.accentPrimary;
  const progressTextColor = isComplete ? COLORS.success : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the previous screen"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create Exercise</Text>
            <Text style={styles.headerSubtitle}>Add to your exercise library</Text>
          </View>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Alert.alert('Help', 'Fill in all fields to create your custom exercise.')}
            accessibilityRole="button"
            accessibilityLabel="Help"
            accessibilityHint="Shows information about creating an exercise"
          >
            <Ionicons name="help-circle-outline" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: progressColor,
              }
            ]} />
          </View>
          <Text style={[styles.progressText, { color: progressTextColor }]}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
      </Animated.View>

      <View style={styles.contentContainerWithButton}>
        <Animated.ScrollView
          style={[styles.content, { opacity: fadeAnim }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
        >
          <View style={styles.formCard}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Exercise Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.name && styles.fieldError,
                  focusedField === 'name' && styles.textInputFocused,
                ]}
                placeholder="e.g. Barbell Squat, Push-ups"
                placeholderTextColor={COLORS.textMuted}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={50}
                onSubmitEditing={() => muscleGroupPickerRef.current?.focus()}
                accessibilityLabel="Exercise name input"
                accessibilityHint="Enter the name of your custom exercise"
              />
              {formData.name.length > 0 && (
                <Text style={styles.characterCount}>
                  {formData.name.length}/50
                </Text>
              )}
              {errors.name && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            <ModalPicker
              ref={muscleGroupPickerRef}
              label="Target Muscle Group"
              type="muscleGroups"
              selectedValue={formData.muscleGroup}
              onSelect={(value) => updateField('muscleGroup', value)}
              error={errors.muscleGroup}
              placeholder="Select primary muscle group"
            />
            <ModalPicker
              label="Equipment Required"
              type="equipment"
              selectedValue={formData.equipment}
              onSelect={(value) => updateField('equipment', value)}
              error={errors.equipment}
              placeholder="Select equipment needed"
            />
            <ModalPicker
              label="Exercise Category"
              type="categories"
              selectedValue={formData.category}
              onSelect={(value) => updateField('category', value)}
              error={errors.category}
              placeholder="Select exercise type"
            />

            <Animated.View
              style={[
                styles.summaryCard,
                {
                  opacity: summaryAnim,
                  transform: [{
                    scale: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })
                  }],
                }
              ]}
              pointerEvents={isComplete ? 'auto' : 'none'}
            >
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.summaryTitle}>Exercise Summary</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryText}><Text style={styles.summaryLabel}>Name:</Text> {formData.name}</Text>
                <Text style={styles.summaryText}><Text style={styles.summaryLabel}>Target:</Text> {formData.muscleGroup}</Text>
                <Text style={styles.summaryText}><Text style={styles.summaryLabel}>Equipment:</Text> {formData.equipment}</Text>
                <Text style={styles.summaryText}><Text style={styles.summaryLabel}>Type:</Text> {formData.category}</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.ScrollView>

        <Animated.View
          style={[
            styles.submitSectionFixed,
            {
              opacity: fadeAnim,
              transform: [{ translateX: shakeAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isComplete && styles.submitButtonDisabled,
              isSubmitting && styles.submitButtonLoading
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isComplete}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create exercise"
            accessibilityHint={isComplete ? "Saves the new exercise to your library" : "Disabled until form is complete"}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
                <Text style={styles.submitButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={COLORS.background} />
                <Text style={styles.submitButtonText}>
                  {isComplete ? 'Create Exercise' : `Complete Form (${Math.round(progress * 100)}%)`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default CreateExerciseScreen;