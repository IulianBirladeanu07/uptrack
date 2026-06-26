import { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import firebaseAuthService from '../../services/firebaseAuthService';

GoogleSignin.configure({
  webClientId: firebaseAuthService.getGoogleWebClientId(),
});

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { setAuthenticated, setProfileSetupComplete } = useContext(AuthContext);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await firebaseAuthService.signInWithEmailAndPassword(email, password, setAuthenticated, setProfileSetupComplete);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No id_token received');
      await firebaseAuthService.signInWithGoogle({ params: { id_token: idToken } }, setAuthenticated, setProfileSetupComplete);
    } catch (e) {
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        setError(e.message || 'Failed to sign in with Google. Please try again.');
      }
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
          onChangeText={(v) => { setEmail(v); setError(null); }}
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
          onChangeText={(v) => { setPassword(v); setError(null); }}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={spacing[6]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={spacing[5]} color={colors.accent.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.accent.buttonText} /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.faded.errorAlt,
    borderWidth: 1,
    borderColor: colors.border.error,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  errorText: {
    flex: 1,
    color: colors.accent.error,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
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