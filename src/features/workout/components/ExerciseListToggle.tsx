import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../../../shared/theme';
import styles from './ExerciseListToggleStyles';

type ExerciseListToggleProps = {
    expanded: boolean;
    collapsedLabel: string;
    collapsedAccessibilityLabel?: string;
    showDivider?: boolean;
    layout?: 'default' | 'inline';
    onPress: () => void;
};

const ExerciseListToggle = ({
    expanded,
    collapsedLabel,
    collapsedAccessibilityLabel,
    showDivider = true,
    layout = 'default',
    onPress,
}: ExerciseListToggleProps) => {
    const label = expanded ? 'Show less' : collapsedLabel;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                layout === 'inline' ? styles.inlineButton : showDivider && styles.divider,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? 'Show fewer exercises' : collapsedAccessibilityLabel || collapsedLabel}
            hitSlop={layout === 'inline' ? { top: spacing[3], bottom: spacing[3] } : undefined}
        >
            {layout === 'inline' && !expanded && <View style={styles.inlineLine} testID="exercise-list-toggle-leading-line" />}
            <Text style={[styles.text, layout === 'inline' && styles.inlineText]} allowFontScaling>{label}</Text>
            {layout === 'inline' && !expanded
                ? <View style={styles.inlineLine} testID="exercise-list-toggle-trailing-line" />
                : layout !== 'inline' && (
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={fontSize[14]}
                        color={colors.accent.primary}
                    />
                )}
        </TouchableOpacity>
    );
};

export default ExerciseListToggle;
