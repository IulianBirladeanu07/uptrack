import { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
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
    androidClientId: firebaseAuthService.getGoogleClientId(),
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
      Alert.alert('Error', 'Failed to sign in with Google: ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>UPTRACK</Text>
      </View>

      <Text style={styles.title}>Login</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
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
        <MaterialIcons name="lock" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={spacing[6]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.text.primary} /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <>
            <Ionicons name="logo-google" size={spacing[5]} color={colors.text.primary} style={styles.googleButtonIcon} />
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
        <Text style={styles.linkText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing[5],
    justifyContent: 'center',
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
  title: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
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
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[16],
    paddingVertical: spacing[2],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  button: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[4],
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing[5],
    shadowColor: colors.accent.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: colors.accent.buttonText,
    fontWeight: fontWeight.bold,
    fontSize: fontSize[18],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: radius[4],
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    marginTop: spacing[5],
    width: '100%',
    shadowColor: '#3367D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButtonText: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize[16],
  },
  googleButtonIcon: {
    marginRight: spacing[3],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkText: {
    color: colors.accent.cyan,
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing[5],
  },
}));

export default LoginScreen;