import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles, { COLORS } from '../WorkoutLibraryScreenStyle';

const HeaderStats = React.memo(({ activeSegment, totalItems, activeSplit, weekProgress, workoutsLogged, totalTime }) => (
  <View style={styles.headerStatsRow}>
    <View style={styles.headerStatItem}>
      <Ionicons 
        name={activeSegment === 'Splits' ? 'calendar-outline' : 'list-outline'} 
        size={normalize(14)} 
        color={COLORS.accentPurple} 
        style={styles.headerStatIcon} 
      />
      <Text style={styles.headerStatValue}>{totalItems}</Text>
      <Text style={styles.headerStatLabel}>{activeSegment === 'Splits' ? 'Split Programs' : 'Templates'}</Text>
    </View>
    
    {activeSegment === 'Splits' ? (
      <View style={styles.headerStatItem}>
        <Ionicons 
          name="fitness-outline" 
          size={normalize(14)} 
          color={COLORS.accentSecondary} 
          style={styles.headerStatIcon} 
        />
        <Text style={styles.headerStatValue}>
          {activeSplit ? activeSplit.name || activeSplit.templateName || 'Active' : 'None'}
        </Text>
        <Text style={styles.headerStatLabel}>Current Split</Text>
      </View>
    ) : (
      <View style={styles.headerStatItem}>
        <Ionicons 
          name="barbell-outline" 
          size={normalize(14)} 
          color={COLORS.accentSecondary} 
          style={styles.headerStatIcon} 
        />
        <Text style={styles.headerStatValue}>{workoutsLogged}</Text>
        <Text style={styles.headerStatLabel}>Workouts Logged</Text>
      </View>
    )}
    
    <View style={styles.headerStatItem}>
      <Ionicons 
        name={activeSegment === 'Splits' ? 'trending-up-outline' : 'time-outline'} 
        size={normalize(14)} 
        color={COLORS.accentPrimary} 
        style={styles.headerStatIcon} 
      />
      <Text style={styles.headerStatValue}>
        {activeSegment === 'Splits' ? `${weekProgress}%` : totalTime}
      </Text>
      <Text style={styles.headerStatLabel}>
        {activeSegment === 'Splits' ? 'Week Progress' : 'Time Logged'}
      </Text>
    </View>
  </View>
));

export default HeaderStats;