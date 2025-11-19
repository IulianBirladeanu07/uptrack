import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BarGraph = ({ dailyCalories, targetCalories, colors }) => {
  // Filter out days with zero calories for average calculation
  const activeDays = dailyCalories.filter(cal => cal > 0);
  const averageCalories = activeDays.reduce((sum, curr) => sum + curr, 0) / (activeDays.length || 1); // Avoid division by zero

  // Determine the maximum scale using a fixed base, max from data, or targetCalories
  const baseMaxCalorie = 3000; // Adjust this base to suit typical data ranges
  const maxCalorie = Math.max(baseMaxCalorie, ...dailyCalories, averageCalories, targetCalories);
  const containerHeight = 175; // Fixed container height
  const minBarHeight = 5; // Minimum bar height for visibility

  const getSafeHeight = (calories) => {
    const height = (calories / maxCalorie) * containerHeight;
    return Math.max(height, minBarHeight); // Ensures minimum height
  };

  const renderDottedLine = (position) => (
    <View style={[styles.dottedLine, { bottom: position }]}>
      {Array.from({ length: 20 }).map((_, index) => (
        <View key={index} style={styles.dot} />
      ))}
    </View>
  );

  const renderMilestoneLines = () => {
    const milestones = [];
    const increment = 500;
    for (let i = 0; i * increment <= maxCalorie; i++) {
      const milestoneCalories = increment * i;
      const position = getSafeHeight(milestoneCalories);

      milestones.push(
        <View key={`milestone-${i}`} style={{ position: 'absolute', left: 0, right: 0, bottom: position }}>
          {renderDottedLine(position)}
          <Text style={styles.milestoneText}>{milestoneCalories}</Text>
        </View>
      );
    }
    return milestones;
  };

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {dailyCalories.length > 0 ? (
          dailyCalories.map((calories, index) => (
            <View key={index} style={[styles.dayContainer, { height: getSafeHeight(calories), backgroundColor: colors[index % colors.length] }]}>
              <Text style={styles.calorieText}>{calories.toFixed(0)} kcal</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}></Text>
        )}
        {renderMilestoneLines()}
      </View>
      <Text style={styles.averageText}>Average this week: {averageCalories.toFixed(0)} kcals</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#02202B',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  barsContainer: {
    position: 'relative',
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8, // Increased margin
    borderRadius: 5,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  bar: {
    borderRadius: 5,
    zIndex: 3,
  },
  calorieText: {
    marginTop: 5,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
  },
  averageText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  dottedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 1,
  },
  dot: {
    width: 2,
    height: 1,
    backgroundColor: '#008080',
  },
  milestoneText: {
    position: 'absolute',
    left: 2,
    color: '#FFF',
    fontSize: 8,
    transform: [{ translateY: -10 }]
  }
});

export default BarGraph;
