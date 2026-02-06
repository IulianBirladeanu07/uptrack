import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { AuthContext } from '../../../auth/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, signOut } from 'firebase/auth';
import { normalize } from '../../../../shared/hooks/useResponsive'

const SettingsScreen = ({ navigation }) => {
  const { userSettings, setUserSettings } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userSettings?.notificationsEnabled || false);
  const [darkTheme, setDarkTheme] = useState(userSettings?.darkTheme || false);

  useEffect(() => {
    if (userSettings) {
      setNotificationsEnabled(userSettings.notificationsEnabled || false);
      setDarkTheme(userSettings.darkTheme || false);
    }
  }, [userSettings]);

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const newSettings = {
        notificationsEnabled,
        darkTheme,
      };

      setUserSettings(newSettings);
      Alert.alert('Success', 'Settings updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePasswordScreen');
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <LinearGradient colors={['#02111B', '#2A2D34']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={normalize(28)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Settings</Text>

        {}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#008080' : '#f4f3f4'}
          />
        </View>

        {}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dark Theme</Text>
          <Switch
            value={darkTheme}
            onValueChange={setDarkTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={darkTheme ? '#008080' : '#f4f3f4'}
          />
        </View>

        {}
        <TouchableOpacity style={styles.card} onPress={handleChangePassword}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Ionicons name="chevron-forward-outline" size={normalize(24)} color="#fff" />
        </TouchableOpacity>

        {}
        <TouchableOpacity style={styles.card} onPress={handleLogout}>
          <Text style={styles.cardTitle}>Logout</Text>
          <Ionicons name="exit-outline" size={normalize(24)} color="#fff" />
        </TouchableOpacity>

        {}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <View style={styles.buttonBackground}>
              <Text style={styles.buttonText}>Save Settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: normalize(20),
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: normalize(40),
    left: normalize(20),
    zIndex: 1,
  },
  header: {
    fontSize: normalize(28),
    color: '#fff',
    textAlign: 'center',
    marginBottom: normalize(35),
    marginTop: normalize(60),
    fontWeight: '600',
    letterSpacing: normalize(1),
  },
  card: {
    backgroundColor: '#02202B',
    paddingVertical: normalize(18), 
    paddingHorizontal: normalize(20),
    borderRadius: normalize(20), 
    marginBottom: normalize(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  cardTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: 'bold',
    letterSpacing: normalize(0.5),
  },
  buttonContainer: {
    marginTop: normalize(30),
    marginBottom: normalize(20),
  },
  saveButton: {
    backgroundColor: '#FFA726',
    paddingVertical: normalize(20),
    borderRadius: normalize(25),
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: normalize(0.8),
  },
});

export default SettingsScreen;
