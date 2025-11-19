import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles, { COLORS } from '../WorkoutLibraryScreenStyle';

const EmptyState = React.memo(({ type, onCreate }) => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name={type === 'Splits' ? 'calendar-month' : 'dumbbell'}
      size={normalize(60)}
      color={COLORS.textSecondary}
    />
    <Text style={styles.emptyStateTitle}>No {type}</Text>
    <Text style={styles.emptyStateDescription}>
      Create a {type.toLowerCase().slice(0, -1)} to {type === 'Splits' ? 'organize your workouts into a structured weekly program' : 'start tracking your progress'}
    </Text>
    <TouchableOpacity style={styles.startButton} onPress={onCreate}>
      <MaterialIcons name="add" size={normalize(20)} color={COLORS.secondary} />
      <Text style={styles.startButtonText}>Create {type.slice(0, -1)}</Text>
    </TouchableOpacity>
  </View>
));

export default EmptyState;