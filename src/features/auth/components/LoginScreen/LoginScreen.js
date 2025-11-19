import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import styles from './LoginScreenStyles';
import firebaseAuthService from '../../services/firebaseAuthService';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation();
  const { setAuthenticated, setProfileSetupComplete } = useContext(AuthContext);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: firebaseAuthService.getGoogleClientId(),
    redirectUri: firebaseAuthService.getRedirectUri(),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed.');
    }
  }, [response]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await firebaseAuthService.signInWithEmailAndPassword(email, password, setAuthenticated, setProfileSetupComplete);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (googleResponse) => {
    setGoogleLoading(true);
    try {
      await firebaseAuthService.signInWithGoogle(googleResponse, setAuthenticated, setProfileSetupComplete, navigation);
    } catch (error) {
      console.log(error)
      Alert.alert('Error', 'Failed to sign in with Google:  ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await firebaseAuthService.sendPasswordResetEmail(email);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>UPTRACK</Text>
      </View>

      {/* Login Title */}
      <Text style={styles.title}>Login</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={24} color="gray" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="gray" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      {/* Google Sign-In Button */}
      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={24} color="#fff" style={styles.googleButtonIcon} />
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Navigation Links */}
      <TouchableOpacity onPress={() => handleForgotPassword()}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
        <Text style={styles.linkText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
