import { Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../shared/theme';
import styles from './ExerciseListToggleStyles';

type ExerciseListToggleProps = {
    expanded: boolean;
    collapsedLabel: string;
    collapsedAccessibilityLabel?: string;
    onPress: () => void;
};

const ExerciseListToggle = ({
    expanded,
    collapsedLabel,
    collapsedAccessibilityLabel,
    onPress,
}: ExerciseListToggleProps) => (
    <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? 'Show fewer exercises' : collapsedAccessibilityLabel || collapsedLabel}
    >
        <Text style={styles.text}>{expanded ? 'Show less' : collapsedLabel}</Text>
        <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.accent.primary}
        />
    </TouchableOpacity>
);

export default ExerciseListToggle;
