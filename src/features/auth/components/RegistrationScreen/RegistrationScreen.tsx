import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRootNavigation } from '../../../../shared/navigation';
import firebaseAuthService from '../../services/firebaseAuthService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { getPasswordStrength, isStrongPassword, isValidEmail } from '../../utils/credentials';
import { registrationVerificationMessage } from '../../utils/verificationEmailCopy';
import AuthScreenLayout from '../AuthScreenLayout';

const RegistrationScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useRootNavigation();

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
        registrationVerificationMessage(email.trim()),
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'An error occurred during registration. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: '' | 'Weak' | 'Good' | 'Strong') => {
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
    <AuthScreenLayout contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>UPTRACK</Text>
      </View>

      <Text style={styles.title}>Registration</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          placeholder="Email"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={spacing[6]} color={colors.text.tertiary} />
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
        <MaterialIcons name="lock" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={confirmedPassword}
          onChangeText={(value) => {
            setConfirmedPassword(value);
            setError(null);
          }}
          placeholder="Confirm Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showConfirmPassword}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={spacing[6]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        testID="registration-submit-button"
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        testID="registration-back-to-login"
        style={styles.loginRow}
        onPress={() => navigation.navigate('Login')}
        hitSlop={styles.loginHitSlop}
      >
        <Text style={styles.loginPrompt}>Already have an account?</Text>
        <Text style={styles.loginLink}>Log in</Text>
      </TouchableOpacity>
    </AuthScreenLayout>
  );
};

const styles = createStyles(() => ({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoText: {
    fontSize: fontSize[32],
    fontWeight: fontWeight.black,
    color: colors.text.primary,
    letterSpacing: 2,
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
    paddingVertical: spacing[2],
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
    borderRadius: 9999,
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
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    borderRadius: radius[4],
    marginTop: spacing[5],
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  loginPrompt: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
  },
  loginLink: {
    color: colors.accent.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
  },
  loginHitSlop: {
    top: spacing[3],
    bottom: spacing[3],
    left: spacing[3],
    right: spacing[3],
  },
}));

export default RegistrationScreen;