import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  
  primary: '#FF9500',
  cyan: '#06B6D4',
  
  text: '#F9FAFB',
  textMuted: '#6B7280',
  
  border: 'rgba(255, 255, 255, 0.08)',
  inputBg: 'rgba(31, 41, 55, 0.5)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
};

const CustomNumericKeyboard = ({ value, onChangeText, onDone, onNext, focusedInputData }) => {
  const shouldReplaceRef = useRef(true);
  const prevFocusedInputRef = useRef(null);
  const insets = useSafeAreaInsets();
    
  useEffect(() => {
    const currentInputKey = focusedInputData 
      ? `${focusedInputData.exerciseIndex}-${focusedInputData.index}-${focusedInputData.type}`
      : null;
    
    shouldReplaceRef.current = true;
    prevFocusedInputRef.current = currentInputKey;
  }, [focusedInputData]);
  
  const handlePress = useCallback((key) => {
    if (key === '⌫') {
      onChangeText(value.slice(0, -1));
      shouldReplaceRef.current = false;
    } else if (key === '✓' || key === '→') {
      
    } else {
      if (shouldReplaceRef.current) {
        onChangeText(key);
        shouldReplaceRef.current = false;
      } else {
        if (key === '.' && value.includes('.')) return;
        if (value.length >= 6) return; 
        onChangeText(value + key);
      }
    }
  }, [value, onChangeText]);

  const handleNextPress = useCallback(() => {
    shouldReplaceRef.current = true;
    onNext();
  }, [onNext]);
  
  const handleDonePress = useCallback(() => {
    shouldReplaceRef.current = true;
    onDone();
  }, [onDone]);
  
  return (
    <View style={[styles.container, { paddingBottom: normalize(20) + insets.bottom }]}>
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.next} 
          onPress={handleNextPress} 
          activeOpacity={0.7}
        >
          <Text style={styles.nextText}>→ Next</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.done} 
          onPress={handleDonePress} 
          activeOpacity={0.7}
        >
          <Text style={styles.doneText}>✓ Done</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {['1', '2', '3'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
      </View>
      <View style={styles.row}>
        {['4', '5', '6'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
      </View>
      <View style={styles.row}>
        {['7', '8', '9'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
      </View>
      <View style={styles.row}>
        <Key key={'.'} k={'.'} onPress={handlePress} specialStyle={styles.dotKey} />
        <Key key={'0'} k={'0'} onPress={handlePress} />
        <Key key={'⌫'} k={'⌫'} onPress={handlePress} specialStyle={styles.deleteKey} />
      </View>
    </View>
  );
};

const Key = React.memo(({ k, onPress, specialStyle }) => (
  <TouchableOpacity 
    style={[styles.key, specialStyle]} 
    onPress={() => onPress(k)}
    activeOpacity={0.7}
  >
    <Text style={[styles.keyText, k === '⌫' && styles.deleteText, k === '.' && styles.dotText]}>
      {k}
    </Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: normalize(12),
    paddingTop: normalize(10),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: normalize(-6) },
    shadowOpacity: 0.5,
    shadowRadius: normalize(10),
    elevation: 12,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: normalize(12),
  },
  next: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    height: normalize(36),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  nextText: {
    color: COLORS.primary,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  done: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    height: normalize(36),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  doneText: {
    color: COLORS.cyan,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: normalize(10),
    marginHorizontal: normalize(-6),
  },
  key: {
    flex: 1,
    height: normalize(56),
    backgroundColor: COLORS.inputBg,
    marginHorizontal: normalize(6),
    borderRadius: normalize(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  keyText: {
    color: COLORS.text,
    fontSize: normalize(24),
    fontWeight: '500',
  },
  dotKey: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderColor: COLORS.border,
  },
  dotText: {
    fontSize: normalize(30),
    lineHeight: normalize(30),
    color: COLORS.textMuted,
    fontWeight: '900',
    marginTop: normalize(-8),
  },
  deleteKey: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderColor: COLORS.border,
  },
  deleteText: {
    fontSize: normalize(18),
    color: COLORS.textMuted,
  },
});

export default React.memo(CustomNumericKeyboard);