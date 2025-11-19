import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUpWithEmailAndPassword } from '../../services/firebaseAuthService';
import styles from './RegistrationScreenStyle';
import { Ionicons } from '@expo/vector-icons';

const RegistrationScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      if (!email || !password || !confirmedPassword) {
        setError('Please fill out all fields.');
        setLoading(false);
        return;
      }
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      if (password !== confirmedPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (!isStrongPassword(password)) {
        setError('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
        setLoading(false);
        return;
      }
      await signUpWithEmailAndPassword(email, password);
      setError(null);
      Alert.alert(
        'Registration Successful',
        'A verification email has been sent. Please verify your email to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error(error);
      setError('An error occurred during registration. Please try again.');
      Alert.alert('Error', 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (isStrongPassword(password)) return 'Strong';
    if (password.length >= 6) return 'Good';
    return 'Weak';
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 'Weak':
        return 'red';
      case 'Good':
        return 'orange';
      case 'Strong':
        return 'green';
      default:
        return 'transparent';
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={true}
        />
        <Text style={{ color: getPasswordStrengthColor(passwordStrength), marginLeft: 10 }}>
          {passwordStrength}
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={confirmedPassword}
          onChangeText={setConfirmedPassword}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RegistrationScreen;