import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { saveMeasurementsToFirestore, fetchLastMeasurements } from '../../helpers/useMeasurements'
import  styles from './MeasurementScreenStyle'

const MeasurementScreen = () => {
  const navigation = useNavigation();
  const [measurements, setMeasurements] = useState({
    bodyWeight: '',
    shoulders: '',
    rightArmSize: '',
    leftArmSize: '',
    rightForearmSize: '',
    leftForearmSize: '',
    bodyFatPercentage: '',
    waist: '',
    hips: '',
    chest: '',
    back: '',
    rightCalf: '',
    leftCalf: '',
    rightLeg: '',
    leftLeg: '',
    neck: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const getLastMeasurements = async () => {
      setIsLoading(true);
      try {
        const lastMeasurements = await fetchLastMeasurements();
        if (lastMeasurements) {
          setMeasurements(lastMeasurements);
        }
      } catch (error) {
        console.error('Error fetching last measurements:', error);
        Alert.alert('Error', 'An error occurred while fetching the last measurements.');
      } finally {
        setIsLoading(false);
      }
    };

    getLastMeasurements();
  }, []);

  const handleInputChange = (name, value) => {
    if (value === '' || /^[0-9]*\.?[0-9]+$/.test(value)) {
      setMeasurements({
        ...measurements,
        [name]: value,
      });
    }
  };

  const isFormValid = () => {
    return Object.values(measurements).every(value => value !== '');
  };

  const saveMeasurements = async () => {
    if (!isFormValid()) {
      Alert.alert('Invalid Input', 'Please fill out all fields with valid numerical values.');
      return;
    }

    setIsLoading(true);
    try {
      await saveMeasurementsToFirestore(measurements);
      Alert.alert('Measurements Saved', 'Your measurements have been saved successfully.');
      setMeasurements({
        bodyWeight: '',
        shoulders: '',
        rightArmSize: '',
        leftArmSize: '',
        rightForearmSize: '',
        leftForearmSize: '',
        bodyFatPercentage: '',
        waist: '',
        hips: '',
        chest: '',
        back: '',
        rightCalf: '',
        leftCalf: '',
        rightLeg: '',
        leftLeg: '',
        neck: '',
        date: new Date().toISOString().split('T')[0],
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving measurements:', error);
      Alert.alert('Error', 'An error occurred while saving the measurements.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date(measurements.date);
    setShowDatePicker(false);
    setMeasurements({ ...measurements, date: currentDate.toISOString().split('T')[0] });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00bfff" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#02111B', '#2A2D34']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContainer}>
          <View style={styles.circleContainer}>
            <View style={styles.profileSummary}>
              <MaterialCommunityIcons name="human" size={80} color="white" />
            </View>
          </View>
          <Text style={styles.header}>Measurements</Text>
        </View>
        
        <View style={styles.detailsSection}>
          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Neck (cm)</Text>
            <Text style={styles.measurementLabel}>Shoulders (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.neck}
              onChangeText={(value) => handleInputChange('neck', value)}
              keyboardType="numeric"
              placeholder="Enter neck measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.shoulders}
              onChangeText={(value) => handleInputChange('shoulders', value)}
              keyboardType="numeric"
              placeholder="Enter shoulders measurement"
              placeholderTextColor="#ccc"
            />
          </View>
          
          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Right Arm (cm)</Text>
            <Text style={styles.measurementLabel}>Left Arm (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.rightArmSize}
              onChangeText={(value) => handleInputChange('rightArmSize', value)}
              keyboardType="numeric"
              placeholder="Enter right arm measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.leftArmSize}
              onChangeText={(value) => handleInputChange('leftArmSize', value)}
              keyboardType="numeric"
              placeholder="Enter left arm measurement"
              placeholderTextColor="#ccc"
            />
          </View>
          
          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Right Forearm (cm)</Text>
            <Text style={styles.measurementLabel}>Left Forearm (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.rightForearmSize}
              onChangeText={(value) => handleInputChange('rightForearmSize', value)}
              keyboardType="numeric"
              placeholder="Enter right forearm measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.leftForearmSize}
              onChangeText={(value) => handleInputChange('leftForearmSize', value)}
              keyboardType="numeric"
              placeholder="Enter left forearm measurement"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Chest (cm)</Text>
            <Text style={styles.measurementLabel}>Back (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.chest}
              onChangeText={(value) => handleInputChange('chest', value)}
              keyboardType="numeric"
              placeholder="Enter chest measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.back}
              onChangeText={(value) => handleInputChange('back', value)}
              keyboardType="numeric"
              placeholder="Enter back measurement"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Waist (cm)</Text>
            <Text style={styles.measurementLabel}>Hips (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.waist}
              onChangeText={(value) => handleInputChange('waist', value)}
              keyboardType="numeric"
              placeholder="Enter waist measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.hips}
              onChangeText={(value) => handleInputChange('hips', value)}
              keyboardType="numeric"
              placeholder="Enter hips measurement"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Right Leg (cm)</Text>
            <Text style={styles.measurementLabel}>Left Leg (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.rightLeg}
              onChangeText={(value) => handleInputChange('rightLeg', value)}
              keyboardType="numeric"
              placeholder="Enter right leg measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.leftLeg}
              onChangeText={(value) => handleInputChange('leftLeg', value)}
              keyboardType="numeric"
              placeholder="Enter left leg measurement"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.measurementInputContainer}>
            <Text style={styles.measurementLabel}>Right Calf (cm)</Text>
            <Text style={styles.measurementLabel}>Left Calf (cm)</Text>
          </View>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.input}
              value={measurements.rightCalf}
              onChangeText={(value) => handleInputChange('rightCalf', value)}
              keyboardType="numeric"
              placeholder="Enter right calf measurement"
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={styles.input}
              value={measurements.leftCalf}
              onChangeText={(value) => handleInputChange('leftCalf', value)}
              keyboardType="numeric"
              placeholder="Enter left calf measurement"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.card}>
            <Ionicons name="barbell-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.measurementLabelCard}>Body Fat %</Text>
            <TextInput
              style={styles.inputCard}
              value={measurements.bodyFatPercentage}
              onChangeText={(value) => handleInputChange('bodyFatPercentage', value)}
              keyboardType="numeric"
              placeholder="Enter body fat percentage"
              placeholderTextColor="#ccc"
            />
          </View>
          
          <View style={styles.card}>
            <Ionicons name="barbell-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.measurementLabelCard}>Body Weight (kg)</Text>
            <TextInput
              style={styles.inputCard}
              value={measurements.bodyWeight}
              onChangeText={(value) => handleInputChange('bodyWeight', value)}
              keyboardType="numeric"
              placeholder="Enter body weight"
              placeholderTextColor="#ccc"
            />
          </View>
          
          <View style={styles.card}>
            <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.icon} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={[styles.inputCard, { paddingVertical: 12 }]}
                value={measurements.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#ccc"
                editable={false}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(measurements.date)}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={saveMeasurements}>
              <View style={styles.buttonBackground}>
                <Text style={styles.buttonText}>Save Measurements</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default MeasurementScreen;
