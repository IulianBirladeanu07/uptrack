import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';

const CustomNumericKeyboard = ({ 
  isVisible, 
  onKeyPress, 
  onClose, 
  onSubmit,
  currentValue = '',
  keyboardType = 'number' 
}) => {
  
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  
  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleKeyPress = (key) => {
    switch (key) {
      case 'delete':
        onKeyPress(currentValue.slice(0, -1));
        break;
      case 'done':
        onSubmit();
        break;
      case '.':
        
        if (keyboardType === 'decimal' && !currentValue.includes('.')) {
          onKeyPress(currentValue + key);
        }
        break;
      default:
        onKeyPress(currentValue + key);
        break;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.currentValue}>{currentValue || '0'}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.keyboardContainer}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('1')}>
            <Text style={styles.keyText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('2')}>
            <Text style={styles.keyText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('3')}>
            <Text style={styles.keyText}>3</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('4')}>
            <Text style={styles.keyText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('5')}>
            <Text style={styles.keyText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('6')}>
            <Text style={styles.keyText}>6</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('7')}>
            <Text style={styles.keyText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('8')}>
            <Text style={styles.keyText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('9')}>
            <Text style={styles.keyText}>9</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          {keyboardType === 'decimal' ? (
            <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('.')}>
              <Text style={styles.keyText}>.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.key} />
          )}
          
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('delete')}>
            <Text style={styles.keyText}>⌫</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <TouchableOpacity style={styles.submitButton} onPress={() => handleKeyPress('done')}>
            <Text style={styles.submitButtonText}>Submit & Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');
const keySize = width / 4 - 20;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 30, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  currentValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  keyboardContainer: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  key: {
    width: keySize,
    height: keySize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 10,
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  submitButton: {
    flex: 1,
    height: keySize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomNumericKeyboard;