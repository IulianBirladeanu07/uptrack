import { type ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  type TouchableOpacityProps,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import styles, { COLORS } from './ExerciseItemStyle';

export const BUTTON_HIT_SLOP = { top: 10, right: 10, bottom: 10, left: 10 };

type CustomButtonProps = Pick<
  TouchableOpacityProps,
  'onPress' | 'onPressIn' | 'onLongPress' | 'style' | 'accessibilityLabel' | 'activeOpacity' | 'hitSlop' | 'disabled'
> & {
  icon?: ReactNode;
  children?: ReactNode;
};

export const CustomButton = ({
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

export const ModalWrapper = ({
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

type ChipProps = {
  label: string | undefined;
  isSelected: boolean | undefined;
  onPress: () => void;
  size?: 'default' | 'small';
};

export const Chip = ({ label, isSelected, onPress, size = 'default' }: ChipProps) => (
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
