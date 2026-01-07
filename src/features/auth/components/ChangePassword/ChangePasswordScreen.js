import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const reauthenticate = async (currentPassword) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      const error = new Error('User not authenticated or email not found.');
      throw error;
    }
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      const result = await reauthenticateWithCredential(user, credential);
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);    
    try {
      await reauthenticate(currentPassword);

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await updatePassword(user, newPassword);
      
        Alert.alert('Success', 'Password updated successfully!');
        navigation.goBack();
      } else {
        throw new Error('User not found.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#02111B', '#2A2D34']} style={styles.gradient}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Change Password</Text>
        
        <View style={styles.card}>
          <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            placeholderTextColor="#ccc"
            secureTextEntry
          />
        </View>
        
        <View style={styles.card}>
          <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            placeholderTextColor="#ccc"
            secureTextEntry
          />
        </View>
        
        <View style={styles.card}>
          <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
            placeholderTextColor="#ccc"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleChangePassword} 
          disabled={loading}
        >
          <View style={styles.buttonBackground}>
            <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
          </View>
        </TouchableOpacity>
      </View>
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    color: '#000',
    flex: 2,
    left: 5,
  },
  icon: {
    marginRight: 10,
  },
  saveButton: {
    shadowColor: '#000',
    backgroundColor: '#008080',
    padding: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChangePasswordScreen;