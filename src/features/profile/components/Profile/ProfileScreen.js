import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { fetchUserProfile } from '../../../auth/services/firebaseAuthService';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';

const ProfileScreen = ({ navigation }) => {
  const { setUserSettings, userSettings } = useContext(WorkoutContext);
  const [profilePicture, setProfilePicture] = useState(userSettings?.profilePicture || 'https:
  const [targetCalories, setTargetCalories] = useState(String(userSettings?.targetCalories || ''));
  const [targetProtein, setTargetProtein] = useState(String(userSettings?.targetProtein || ''));
  const [targetFats, setTargetFats] = useState(String(userSettings?.targetFats || ''));
  const [targetCarbs, setTargetCarbs] = useState(String(userSettings?.targetCarbs || ''));
  const [username, setUsername] = useState(userSettings?.username || '');
  const [email, setEmail] = useState(userSettings?.email || '');
  const [age, setAge] = useState(String(userSettings?.age || ''));
  const [weight, setWeight] = useState(String(userSettings?.weight || ''));
  const [height, setHeight] = useState(String(userSettings?.height || ''));
  const [dob, setDob] = useState(userSettings?.dob ? new Date(userSettings.dob) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const loadUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const uid = user.uid;
      try {
        const profileData = await fetchUserProfile(uid);
        if (profileData) {
          setProfilePicture(profileData.profilePicture);
          setTargetCalories(String(profileData.targetCalories || ''));
          setTargetProtein(String(profileData.targetProtein || ''));
          setTargetFats(String(profileData.targetFats || ''));
          setTargetCarbs(String(profileData.targetCarbs || ''));
          setUsername(profileData.username || '');
          setEmail(profileData.email || '');
          setAge(String(profileData.age || ''));
          setWeight(String(profileData.weight || ''));
          setHeight(String(profileData.height || ''));
          setDob(profileData.dob ? new Date(profileData.dob) : new Date());
          setUserSettings(profileData);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    loadUserProfile();
  }, [setUserSettings]);

  const validate = () => {
    let valid = true;
    let errors = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
      valid = false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Valid email is required';
      valid = false;
    }
    if (!age.trim() || isNaN(age) || Number(age) <= 0) {
      errors.age = 'Valid age is required';
      valid = false;
    }
    if (!weight.trim() || isNaN(weight) || Number(weight) <= 0) {
      errors.weight = 'Valid weight is required';
      valid = false;
    }
    if (!height.trim() || isNaN(height) || Number(height) <= 0) {
      errors.height = 'Valid height is required';
      valid = false;
    }
    if (!targetCalories.trim() || isNaN(targetCalories) || Number(targetCalories) <= 0) {
      errors.targetCalories = 'Valid target calories is required';
      valid = false;
    }
    if (!targetProtein.trim() || isNaN(targetProtein) || Number(targetProtein) <= 0) {
      errors.targetProtein = 'Valid target protein is required';
      valid = false;
    }
    if (!targetFats.trim() || isNaN(targetFats) || Number(targetFats) <= 0) {
      errors.targetFats = 'Valid target fats is required';
      valid = false;
    }
    if (!targetCarbs.trim() || isNaN(targetCarbs) || Number(targetCarbs) <= 0) {
      errors.targetCarbs = 'Valid target carbs is required';
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const handleSave = async () => {
    if (validate()) {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const uid = user.uid;
      const profileData = {
        profilePicture,
        targetCalories: Number(targetCalories),
        targetProtein: Number(targetProtein),
        targetFats: Number(targetFats),
        targetCarbs: Number(targetCarbs),
        username,
        email,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        dob: dob.toISOString(),
      };

      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, profileData);
        setUserSettings(profileData);
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleCancel = () => {
    setProfilePicture(userSettings?.profilePicture || 'https:
    setTargetCalories(String(userSettings?.targetCalories || ''));
    setTargetProtein(String(userSettings?.targetProtein || ''));
    setTargetFats(String(userSettings?.targetFats || ''));
    setTargetCarbs(String(userSettings?.targetCarbs || ''));
    setUsername(userSettings?.username || '');
    setEmail(userSettings?.email || '');
    setAge(String(userSettings?.age || ''));
    setWeight(String(userSettings?.weight || ''));
    setHeight(String(userSettings?.height || ''));
    setDob(userSettings?.dob ? new Date(userSettings.dob) : new Date());
    setErrors({});
    setIsEditing(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(false);
    setDob(currentDate);
  };

  return (
    <LinearGradient colors={['#02111B', '#2A2D34']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            {isEditing && <Text style={styles.changePictureText}>Change Picture</Text>}
          </TouchableOpacity>
          <Text style={styles.username}>{username || 'Username'}</Text>
        </View>
        <Text style={styles.header}>Set Your Profile</Text>
        {isEditing ? (
          <>
            <View style={styles.card}>
              <Ionicons name="person-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.username && { borderColor: 'red', borderWidth: 1 }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            <View style={styles.card}>
              <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.email && { borderColor: 'red', borderWidth: 1 }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="Enter your email"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.age && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            <View style={styles.card}>
              <Ionicons name="barbell-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.weight && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="Enter your weight"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            <View style={styles.card}>
              <Ionicons name="resize-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.height && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                placeholder="Enter your height"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.icon} />
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.dateInput, errors.dob && { borderColor: 'red', borderWidth: 1 }]}>{dob.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>
            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            <Text style={styles.header}>Nutritional Targets</Text>
            <View style={styles.card}>
              <Ionicons name="flame-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.targetCalories && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={targetCalories}
                onChangeText={setTargetCalories}
                placeholder="Enter target calories (kcal)"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.targetCalories && <Text style={styles.errorText}>{errors.targetCalories}</Text>}
            <View style={styles.card}>
              <Ionicons name="nutrition-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.targetProtein && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={targetProtein}
                onChangeText={setTargetProtein}
                placeholder="Enter target protein (g)"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.targetProtein && <Text style={styles.errorText}>{errors.targetProtein}</Text>}
            <View style={styles.card}>
              <Ionicons name="fast-food-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.targetFats && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={targetFats}
                onChangeText={setTargetFats}
                placeholder="Enter target fats (g)"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.targetFats && <Text style={styles.errorText}>{errors.targetFats}</Text>}
            <View style={styles.card}>
              <Ionicons name="restaurant-outline" size={20} color="#fff" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.targetCarbs && { borderColor: 'red', borderWidth: 1 }]}
                keyboardType="numeric"
                value={targetCarbs}
                onChangeText={setTargetCarbs}
                placeholder="Enter target carbs (g)"
                placeholderTextColor="#ccc"
              />
            </View>
            {errors.targetCarbs && <Text style={styles.errorText}>{errors.targetCarbs}</Text>}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <View style={styles.buttonBackground}>
                  <Text style={styles.buttonText}>Save</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <View style={styles.buttonBackground}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Ionicons name="person-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{username}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="mail-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{email}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{age}</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="barbell-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{weight} kg</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="resize-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{height} cm</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{dob.toDateString()}</Text>
            </View>
            <Text style={styles.header}>Nutritional Targets</Text>
            <View style={styles.card}>
              <Ionicons name="flame-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{targetCalories} kcal</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="nutrition-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{targetProtein} g</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="fast-food-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{targetFats} g</Text>
            </View>
            <View style={styles.card}>
              <Ionicons name="restaurant-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.input}>{targetCarbs} g</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={() => setIsEditing(true)}>
                <View style={styles.buttonBackground}>
                  <Text style={styles.buttonText}>Edit</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#00bfff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  changePictureText: {
    color: '#00bfff',
    marginTop: 5,
    textAlign: 'center',
  },
  username: {
    marginTop: 10,
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#02202B',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    color: '#000',
    flex: 2,
    left: 5,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    color: '#000',
    flex: 2,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
    shadowColor: '#000',
    backgroundColor: '#008080',
    padding: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
    shadowColor: '#000',
    backgroundColor: 'red',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    borderRadius: 8,
    shadowRadius: 3,
    elevation: 5,
    padding: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginLeft: 10,
  },
});

export default ProfileScreen;
