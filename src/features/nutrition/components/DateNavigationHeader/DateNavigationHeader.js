import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';

const DateNavigationHeader = ({ selectedDate, onDateChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      onDateChange(date);
    }
  };

  return (
    <>
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Open date picker"
          testID="date-picker-button"
        >
          <MaterialCommunityIcons name="calendar" size={28} color="#fdf5ec" />
        </TouchableOpacity>
        <Text style={styles.dateText} accessibilityLabel={`Selected date: ${selectedDate.toDateString()}`}>
          {selectedDate.toDateString()}
        </Text>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          testID="date-picker"
        />
      )}
    </>
  );
};

export default DateNavigationHeader;