import { memo, useState, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Easing,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles, { COLORS } from './CreateExerciseScreenStyle';
import {
  EXERCISE_DATA,
  filterPickerOptions,
  type PickerType,
  type PickerOption,
} from './createExerciseForm';

export type ModalPickerHandle = { focus: () => void };
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

export const ModalPicker = forwardRef<ModalPickerHandle, ModalPickerProps>(({
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
