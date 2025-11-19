import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles, { COLORS } from '../WorkoutLibraryScreenStyle';

const SegmentedControl = React.memo(({ activeSegment, onTemplatesPress, onSplitsPress }) => (
  <View style={styles.segmentedControlContainer}>
    <TouchableOpacity
      style={[styles.segmentButton, activeSegment === 'Templates' && styles.segmentButtonActive]}
      onPress={onTemplatesPress}
      accessibilityLabel="View workout templates"
      accessibilityHint="Shows the list of workout templates"
    >
      <MaterialCommunityIcons
        name="dumbbell"
        size={normalize(16)}
        color={activeSegment === 'Templates' ? COLORS.background : COLORS.textSecondary}
      />
      <Text style={[styles.segmentButtonText, activeSegment === 'Templates' && styles.segmentButtonTextActive]}>
        Templates
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.segmentButton, activeSegment === 'Splits' && styles.segmentButtonActive]}
      onPress={onSplitsPress}
      accessibilityLabel="View workout splits"
      accessibilityHint="Shows the list of workout splits"
    >
      <MaterialCommunityIcons
        name="calendar-blank-outline"
        size={normalize(16)}
        color={activeSegment === 'Splits' ? COLORS.background : COLORS.textSecondary}
      />
      <Text style={[styles.segmentButtonText, activeSegment === 'Splits' && styles.segmentButtonTextActive]}>
        Splits
      </Text>
    </TouchableOpacity>
  </View>
));

export default SegmentedControl;