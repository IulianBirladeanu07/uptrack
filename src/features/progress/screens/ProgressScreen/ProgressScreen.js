import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

const mockData = {
  profile: {
    name: 'John Doe',
    bio: '“Stay fit, stay healthy!”',
    profilePic: 'https://via.placeholder.com/80',
  },
  progressSummary: {
    daysActive: 120,
    workoutsCompleted: 75,
    caloriesBurned: 15000,
    avgCalories: 2200,
  },
  weightData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [220, 215, 210, 205, 200, 195],
      },
    ],
  },
  progressBar: 0.7,
  workouts: [
    { date: '2024-05-01', type: 'Running', duration: '30 mins', calories: 300 },
    { date: '2024-05-02', type: 'Cycling', duration: '45 mins', calories: 450 },
    // Add more workouts as needed
  ],
  nutrition: {
    dailyCaloricIntake: [2000, 2200, 2100, 2300, 2200, 2500, 2400],
    macronutrients: {
      carbs: 50,
      proteins: 30,
      fats: 20,
    },
  },
  bodyMeasurements: {
    weight: 195,
    bodyFat: 15,
    measurements: {
      waist: 32,
      hips: 40,
      chest: 42,
    },
  },
  achievements: [
    { title: '50 Workouts Completed', date: '2024-04-01' },
    { title: '10k Steps in a Day', date: '2024-05-15' },
    // Add more achievements as needed
  ],
};

const ProgressScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>
      
      <View style={styles.profileSummary}>
        <Image source={{ uri: mockData.profile.profilePic }} style={styles.profilePic} />
        <Text style={styles.name}>{mockData.profile.name}</Text>
        <Text style={styles.bio}>{mockData.profile.bio}</Text>
      </View>
      
      <View style={styles.progressSummary}>
        <Text style={styles.summaryText}>Days Active: {mockData.progressSummary.daysActive}</Text>
        <Text style={styles.summaryText}>Workouts Completed: {mockData.progressSummary.workoutsCompleted}</Text>
        <Text style={styles.summaryText}>Calories Burned: {mockData.progressSummary.caloriesBurned}</Text>
        <Text style={styles.summaryText}>Average Calories: {mockData.progressSummary.avgCalories}/day</Text>
      </View>
      
      <View style={styles.charts}>
        <Text style={styles.chartTitle}>Weight Change Over Time</Text>
        {/* <LineChart
          data={mockData.weightData}
          width={300}
          height={220}
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }} */}
        {/* /> */}
      </View>

      <View style={styles.progressBarSection}>
        <Text style={styles.progressBarTitle}>Daily Goal Completion</Text>
        {/* <ProgressBar progress={mockData.progressBar} color={'#6200ea'} /> */}
        <Text style={styles.progressBarText}>{Math.round(mockData.progressBar * 100)}% of daily goal achieved</Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Workouts</Text>
        {mockData.workouts.map((workout, index) => (
          <View key={index} style={styles.detailItem}>
            <Text style={styles.progressBarText}>{workout.date}: {workout.type} - {workout.duration}, {workout.calories} calories</Text>
          </View>
        ))}
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Nutrition</Text>
        <Text style={styles.intakeText}>Daily Caloric Intake:</Text>
        {mockData.nutrition.dailyCaloricIntake.map((calories, index) => (
          <Text style={styles.progressBarText}key={index}>Day {index + 1}: {calories} calories</Text>
        ))}
        <Text>Macronutrients Distribution:</Text>
        {/* <PieChart
          data={[
            {
              name: 'Carbs',
              population: mockData.nutrition.macronutrients.carbs,
              color: '#f39c12',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
            {
              name: 'Proteins',
              population: mockData.nutrition.macronutrients.proteins,
              color: '#2ecc71',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
            {
              name: 'Fats',
              population: mockData.nutrition.macronutrients.fats,
              color: '#e74c3c',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
          ]}
          width={300}
          height={220}
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#eff3ff',
            backgroundGradientTo: '#efefef',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        /> */}
      </View>
      
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Body Measurements</Text>
        <Text style={styles.progressBarText}>Weight: {mockData.bodyMeasurements.weight} lbs</Text>
        <Text style={styles.progressBarText}>Body Fat: {mockData.bodyMeasurements.bodyFat}%</Text>
        <Text style={styles.progressBarText}>Waist: {mockData.bodyMeasurements.measurements.waist} in</Text>
        <Text style={styles.progressBarText}>Hips: {mockData.bodyMeasurements.measurements.hips} in</Text>
        <Text style={styles.progressBarText}>Chest: {mockData.bodyMeasurements.measurements.chest} in</Text>
      </View>
      
      <View style={styles.achievements}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {mockData.achievements.map((achievement, index) => (
          <View key={index} style={styles.detailItem}>
            <Text style={styles.progressBarText}>{achievement.title} - {achievement.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02111B',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSummary: {
    alignItems: 'center',
    padding: 20,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  bio: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#fff',
  },
  progressSummary: {
    padding: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#fff',
  },
  charts: {
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarSection: {
    padding: 20,
  },
  progressBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarText: {
    fontSize: 14,
    color: '#fff',
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailItem: {
    marginVertical: 5,
  },
  achievements: {
    padding: 20,
  },
  progressPhotos: {
    padding: 20,
  },
  intakeText: {
    color: '#fff',
  }
});

export default ProgressScreen;
