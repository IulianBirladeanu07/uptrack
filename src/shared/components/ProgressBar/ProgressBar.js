import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalize } from '../../hooks/useResponsive';

const ProgressBar = ({
  value,
  maxValue,
  customText,
  customColor = '#3498db',
  showLabel = true,
  unit = 'g',
}) => {
  const consumedPercentage = Math.min((value / maxValue) * 100, 100);
  const fillWidth = `${consumedPercentage}%`;

  return (
    <View style={styles.container}>
      <Text style={styles.customText}>{customText}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: fillWidth, backgroundColor: customColor }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {`${value.toFixed(0)} / ${maxValue.toFixed(0)} ${unit}`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: normalize(8),
    flex: 1,
  },
  progressBarContainer: {
    position: 'relative',
    height: normalize(10),
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: normalize(10),
    overflow: 'hidden',
    marginVertical: normalize(4),
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: normalize(10),
  },
  label: {
    fontSize: normalize(14),
    color: '#fff',
    fontWeight: 'bold',
    marginTop: normalize(5),
  },
  customText: {
    fontSize: normalize(16),
    color: '#fff',
    marginTop: normalize(5),
  },
});

export default ProgressBar;
