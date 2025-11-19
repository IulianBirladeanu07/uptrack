import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { normalize } from '../../hooks/useResponsive';
import Icon from 'react-native-vector-icons/Ionicons';

const DoneButton = ({ selectedFoods, handleDone }) => {
  if (!Array.isArray(selectedFoods) || selectedFoods.length === 0) {
    return null;
  }

  const count = selectedFoods.length;
  const itemText = count === 1 ? 'item' : 'items';

  return (
    <TouchableOpacity
      style={styles.doneButton}
      onPress={handleDone}
      activeOpacity={0.85}
    >
      <View style={styles.buttonContent}>
        <Icon name="checkmark-circle" size={normalize(22)} color={"#0f172a"}/>
        <Text style={styles.doneButtonText}>
          Add {count} {itemText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    backgroundColor: '#FF9500',
    borderRadius: normalize(16),
    width: '100%',
    paddingVertical: normalize(18),
    paddingHorizontal: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: normalize(12),
    elevation: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },
  doneButtonText: {
    color: '#0f172a',
    fontSize: normalize(16),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default DoneButton;