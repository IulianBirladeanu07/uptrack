import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../../../shared/theme';
import { MUSCLE_GROUP_COLORS, FALLBACK_MUSCLE_COLORS } from '../../../../../shared/theme/constants';
import styles from './MuscleCoverageCardStyles';

const MuscleCoverageCard = ({ muscleGroupSets, uncoveredMuscles, subtitle }) => {
  const maxSets = Math.max(...muscleGroupSets.map(item => item.sets), 1);

  return (
    <View style={styles.volumeCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconBox}>
            <Ionicons name="bar-chart" size={spacing.iconSm} color={colors.accent.purple} />
          </View>
          <Text style={styles.cardTitle}>Muscle Coverage</Text>
        </View>
      </View>
      <Text style={styles.cardSubtext}>{subtitle}</Text>

      {muscleGroupSets.length > 0 ? (
        <View style={styles.volumeList}>
          {muscleGroupSets.map((item, index) => {
            const color = MUSCLE_GROUP_COLORS[item.muscle] ?? FALLBACK_MUSCLE_COLORS[index % FALLBACK_MUSCLE_COLORS.length];
            return (
              <View key={item.muscle} style={styles.volumeRow}>
                <View style={styles.volumeLabelWrap}>
                  <View style={[styles.volumeDot, { backgroundColor: color }]} />
                  <Text style={styles.volumeLabel} numberOfLines={1}>{item.muscle}</Text>
                </View>
                <View style={styles.volumeBarTrack}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      {
                        width: `${Math.max((item.sets / maxSets) * 100, 6)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.volumeValue}>{item.sets}</Text>
              </View>
            );
          })}
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