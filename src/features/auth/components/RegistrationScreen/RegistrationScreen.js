import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firebaseAuthService from '../../services/firebaseAuthService';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const RegistrationScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      await firebaseAuthService.signUpWithEmailAndPassword(email, password);
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
      const errorMessage = error.message || 'An error occurred during registration. Please try again.';
      setError(errorMessage);
      Alert.alert('Registration Error', errorMessage);
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
        return colors.accent.error;
      case 'Good':
        return colors.accent.warning;
      case 'Strong':
        return colors.accent.success;
      default:
        return 'transparent';
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={spacing[5]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={spacing[5]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={spacing[5]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthIndicator, { backgroundColor: getPasswordStrengthColor(passwordStrength) }]} />
          <Text style={[styles.strengthText, { color: getPasswordStrengthColor(passwordStrength) }]}>
            {passwordStrength}
          </Text>
        </View>
      )}
      {password.length > 0 && !isStrongPassword(password) && (
        <Text style={styles.requirementsText}>
          Password must include: uppercase, lowercase, number, and special character (!@#$%^&*(),.?":{}|&lt;&gt;)
        </Text>
      )}

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={spacing[5]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={confirmedPassword}
          onChangeText={setConfirmedPassword}
          placeholder="Confirm Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={spacing[5]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.accent.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
  title: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[8],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    width: '100%',
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    width: '100%',
    maxWidth: 400,
  },
  strengthIndicator: {
    width: spacing[3],
    height: spacing[3],
    borderRadius: radius.full,
    marginRight: spacing[2],
  },
  strengthText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
  },
  requirementsText: {
    color: colors.text.tertiary,
    fontSize: fontSize[12],
    marginTop: spacing[1],
    marginBottom: spacing[2],
    maxWidth: 400,
  },
  button: {
    backgroundColor: colors.accent.primary,
    padding: spacing[4],
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
  error: {
    color: colors.accent.error,
    marginTop: spacing[2],
    marginBottom: spacing[2],
    textAlign: 'center',
    fontSize: fontSize[14],
    maxWidth: 400,
  },
  linkText: {
    color: colors.accent.cyan,
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing[5],
  },
}));

export default RegistrationScreen;