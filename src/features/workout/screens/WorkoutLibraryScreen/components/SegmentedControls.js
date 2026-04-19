import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import { colors } from '../../../../../shared/theme';
import styles from '../WorkoutLibraryScreenStyle';

const SegmentedControl = React.memo(({ activeSegment, onTemplatesPress, onSplitsPress }) => (
    <View style={styles.segmentedControlContainer}>
        <TouchableOpacity
            style={[styles.segmentButton, activeSegment === 'Templates' && styles.segmentButtonActive]}
            onPress={onTemplatesPress}
        >
            <MaterialCommunityIcons
                name="dumbbell"
                size={normalize(16)}
                color={activeSegment === 'Templates' ? colors.accent.buttonText : colors.text.secondary}
            />
            <Text style={[styles.segmentButtonText, activeSegment === 'Templates' && styles.segmentButtonTextActive]}>
                Templates
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.segmentButton, activeSegment === 'Splits' && styles.segmentButtonActive]}
            onPress={onSplitsPress}
        >
            <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={normalize(16)}
                color={activeSegment === 'Splits' ? colors.accent.buttonText : colors.text.secondary}
            />
            <Text style={[styles.segmentButtonText, activeSegment === 'Splits' && styles.segmentButtonTextActive]}>
                Splits
            </Text>
        </TouchableOpacity>
    </View>
));

export default SegmentedControl;