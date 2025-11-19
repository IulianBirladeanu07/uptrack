import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { sendPasswordResetEmail } from '../../services/firebaseAuthService';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const handleForgotPassword = async () => {    
    if (!email.trim()) {
      const errorMsg = 'Email is required';
      setError(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
    
      await sendPasswordResetEmail(email);
            
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              navigation.navigate('Login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Email</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.backToLoginButton} 
        onPress={() => {
          navigation.navigate('Login');
        }}
      >
        <Text style={styles.backToLoginButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#02111B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#fdf5ec',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: windowWidth - 40,
    maxWidth: 400,
  },
  input: {
    color: '#000000',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e71d27',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: windowWidth - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  backToLoginButton: {
    marginTop: 20,
  },
  backToLoginButtonText: {
    color: '#4799ba',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  error: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;