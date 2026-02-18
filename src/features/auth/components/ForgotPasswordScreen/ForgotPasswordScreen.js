import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { sendPasswordResetEmail } from '../../services/firebaseAuthService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      const errorMsg = 'Email is required';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
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
      const errorMessage = error.message || 'Failed to send password reset email. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={spacing[20]} color={colors.accent.primary} />
      </View>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={spacing.iconLg} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          placeholder="Email"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.accent.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Send Reset Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backToLoginButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="arrow-back" size={spacing.iconMd} color={colors.accent.cyan} />
        <Text style={styles.backToLoginButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    width: spacing[24],
    height: spacing[24],
    borderRadius: radius.full,
    backgroundColor: colors.faded.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  title: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
    paddingHorizontal: spacing[6],
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginVertical: spacing[2],
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[16],
  },
  button: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: radius[4],
    marginTop: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.accent.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: colors.accent.buttonText,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    fontSize: fontSize[18],
  },
  backToLoginButton: {
    marginTop: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  backToLoginButtonText: {
    color: colors.accent.cyan,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    fontSize: fontSize[16],
  },
  error: {
    color: colors.accent.error,
    marginTop: spacing[2],
    textAlign: 'center',
    fontSize: fontSize[14],
    maxWidth: 400,
  },
}));

export default ForgotPasswordScreen;