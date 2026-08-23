import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from './DaySelectorStyles';

const DaySelector = ({
  days,
  selectedDayId,
  onSelectDay,
  layout = 'row',
  showLabels = false,
  trailingContent,
}) => {
  const dayItems = days.map(day => {
    const isSelected = day.id === selectedDayId;
    const dayHasWorkout = !!day.hasWorkout;

    return (
      <TouchableOpacity
        key={day.id}
        style={styles.dayColumn}
        onPress={() => onSelectDay(day.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayCircle,
          dayHasWorkout && !isSelected && styles.dayCircleHasWorkout,
          isSelected && styles.dayCircleSelected,
        ]}>
          <Text style={[
            styles.dayCircleText,
            dayHasWorkout && !isSelected && styles.dayCircleTextHasWorkout,
            isSelected && styles.dayCircleTextSelected,
          ]}>
            {day.shortLabel}
          </Text>
        </View>
        {showLabels && (
          <Text style={[styles.dayLabel, (isSelected || day.isToday) && styles.dayLabelSelected]}>
            {day.name.slice(0, 3)}
          </Text>
        )}
      </TouchableOpacity>
    );
  });

  if (layout === 'scroll') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dayItems}
        {trailingContent}
      </ScrollView>
    );
  }

  return (
    <View style={layout === 'wrap' ? styles.rowWrap : styles.row}>
      {dayItems}
      {trailingContent}
    </View>
  );
};

export default React.memo(DaySelector);