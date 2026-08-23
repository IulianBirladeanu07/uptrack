import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../../../shared/theme';
import styles from './MuscleCoverageCardStyles';

const MuscleCoverageCard = ({ muscleGroupSets, uncoveredMuscles, subtitle }) => {
  const maxSets = Math.max(...muscleGroupSets.map(item => item.sets), 1);

  return (
    <View style={styles.volumeCard}>
      <Text style={styles.cardTitle}>Muscle Coverage</Text>
      <Text style={styles.cardSubtext}>{subtitle}</Text>

      {muscleGroupSets.length > 0 ? (
        <View style={styles.volumeList}>
          {muscleGroupSets.map((item) => (
            <View key={item.muscle} style={styles.volumeRow}>
              <Text style={styles.volumeLabel} numberOfLines={1}>{item.muscle}</Text>
              <View style={styles.volumeBarTrack}>
                <View
                  style={[
                    styles.volumeBarFill,
                    { width: `${Math.max((item.sets / maxSets) * 100, 6)}%` },
                  ]}
                />
              </View>
              <Text style={styles.volumeValue}>{item.sets}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.volumeEmptyText}>No exercises added yet</Text>
      )}

      {uncoveredMuscles.length > 0 && (
        <View style={styles.coverageNote}>
          <Ionicons name="alert-circle-outline" size={spacing.iconSm} color={colors.accent.warning} />
          <Text style={styles.coverageNoteText}>
            Not targeted: {uncoveredMuscles.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(MuscleCoverageCard);