import { memo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from './DaySelectorStyles';

type DayItem = {
  id: string;
  name: string;
  shortLabel: string;
  hasWorkout?: boolean;
  isToday?: boolean;
};

type DaySelectorProps = {
  days: DayItem[];
  selectedDayId: string | number | null | undefined;
  onSelectDay: (id: string) => void;
  layout?: 'row' | 'wrap' | 'scroll' | string;
  showLabels?: boolean;
  trailingContent?: ReactNode;
};

const DaySelector = ({
  days,
  selectedDayId,
  onSelectDay,
  layout = 'row',
  showLabels = false,
  trailingContent,
}: DaySelectorProps) => {
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

export default memo(DaySelector);