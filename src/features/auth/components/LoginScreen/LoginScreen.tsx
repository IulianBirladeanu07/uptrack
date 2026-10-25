import { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import firebaseAuthService from '../../services/firebaseAuthService';
import { useRootNavigation } from '../../../../shared/navigation';
import type { FirebaseError } from 'firebase/app';
import { getAuthErrorMessage } from '../../utils/authErrorMessage';
import {
  loginVerificationNotice,
  resentVerificationMessage,
} from '../../utils/verificationEmailCopy';
import { createAppleSignInNonce } from '../../utils/appleSignInNonce';
import AuthScreenLayout from '../AuthScreenLayout';

const RESEND_COOLDOWN_SECONDS = 60;

const googleWebClientId = firebaseAuthService.getGoogleWebClientId();
if (googleWebClientId) {
  GoogleSignin.configure({ webClientId: googleWebClientId });
}

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const socialSignInInProgress = useRef(false);

  const navigation = useRootNavigation();
  const { setAuthenticated, setProfileSetupComplete } = useContext(AuthContext)!;

  const counting = cooldown > 0;

  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [counting]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then(available => {
        if (mounted) setAppleSignInAvailable(available);
      })
      .catch(error => {
        console.error('Could not check Apple sign-in availability:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setUnverified(false);
    setLoading(true);
    try {
      await firebaseAuthService.signInWithEmailAndPassword(email, password, setAuthenticated, setProfileSetupComplete);
    } catch (e) {
      const err = e as FirebaseError & { message?: string };
      setError(err.code === 'auth/email-not-verified'
        ? err.message ?? 'Please verify your email before signing in.'
        : getAuthErrorMessage(e, 'signIn'));
      setUnverified(err.code === 'auth/email-not-verified');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      const sent = await firebaseAuthService.resendVerificationEmail(email, password);
      if (sent) {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        Alert.alert('Verification Email Sent', resentVerificationMessage);
      }
    } catch (e) {
      setError(getAuthErrorMessage(e, 'verification'));
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (socialSignInInProgress.current) return;
    socialSignInInProgress.current = true;
    setError(null);
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No id_token received');
      await firebaseAuthService.signInWithGoogle({ params: { id_token: idToken } }, setAuthenticated, setProfileSetupComplete);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        setError(getAuthErrorMessage(e, 'googleSignIn'));
      }
    } finally {
      setGoogleLoading(false);
      socialSignInInProgress.current = false;
    }
  };

  const handleAppleSignIn = async () => {
    if (socialSignInInProgress.current) return;
    socialSignInInProgress.current = true;
    setError(null);
    setAppleLoading(true);
    try {
      const { rawNonce, hashedNonce } = await createAppleSignInNonce();
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) {
        throw new Error('Apple did not return an identity token.');
      }
      await firebaseAuthService.signInWithApple(
        appleCredential.identityToken,
        rawNonce,
        { email: appleCredential.email, fullName: appleCredential.fullName },
        setAuthenticated,
        setProfileSetupComplete,
      );
    } catch (e) {
      const err = e as { code?: string };
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setError(getAuthErrorMessage(e, 'appleSignIn'));
      }
    } finally {
      setAppleLoading(false);
      socialSignInInProgress.current = false;
    }
  };

  return (
    <AuthScreenLayout contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>UPTRACK</Text>
      </View>

      <Text style={styles.title}>Login</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={spacing[6]} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null); setUnverified(false); }}
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
          onChangeText={(v) => { setPassword(v); setError(null); setUnverified(false); }}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={spacing[6]} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="forgot-password-link"
        style={styles.forgotLink}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {error && !unverified && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={spacing[5]} color={colors.accent.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {unverified && (
        <View style={styles.noticeBanner} testID="verify-email-notice">
          <View style={styles.noticeHeader}>
            <Ionicons name="mail-unread-outline" size={spacing[5]} color={colors.accent.primary} />
            <Text style={styles.noticeTitle}>Verify your email</Text>
          </View>
          <Text style={styles.noticeText}>
            {loginVerificationNotice(email.trim())}
          </Text>
          <TouchableOpacity
            testID="resend-verification-button"
            style={[styles.resendButton, (resending || cooldown > 0) && styles.resendButtonDisabled]}
            onPress={handleResend}
            disabled={resending || cooldown > 0}
          >
            {resending ? (
              <ActivityIndicator color={colors.accent.primary} />
            ) : (
              <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity testID="login-submit-button" style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.accent.buttonText} /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading || appleLoading}
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

      {appleSignInAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          testID="apple-sign-in-button"
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius[4]}
          style={[styles.appleButton, (appleLoading || googleLoading) && styles.buttonDisabled]}
          onPress={handleAppleSignIn}
        />
      )}

      <View style={styles.registerRow}>
        <Text style={styles.registerPrompt}>New to Uptrack?</Text>
        <TouchableOpacity
          testID="register-link"
          onPress={() => navigation.navigate('Registration')}
          hitSlop={styles.registerHitSlop}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = createStyles(() => ({
  container: {
    flexGrow: 1,
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
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    width: '100%',
  },
  googleButtonText: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize[16],
  },
  googleButtonIcon: {
    marginRight: spacing[3],
  },
  appleButton: {
    width: '100%',
    height: 48,
    marginTop: spacing[3],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  noticeBanner: {
    backgroundColor: colors.faded.primaryLight,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  noticeTitle: {
    color: colors.text.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
  },
  noticeText: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: radius[3],
    paddingVertical: spacing[3],
    marginTop: spacing[1],
  },
  resendButtonDisabled: {
    borderColor: colors.border.default,
  },
  resendText: {
    color: colors.accent.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
  },
  resendTextDisabled: {
    color: colors.text.tertiary,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing[2],
  },
  forgotText: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    fontSize: fontSize[12],
    color: colors.text.tertiary,
    fontWeight: fontWeight.semibold,
    marginHorizontal: spacing[3],
    textTransform: 'uppercase',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  registerPrompt: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
  },
  registerText: {
    color: colors.accent.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
  },
  registerHitSlop: {
    top: spacing[3],
    bottom: spacing[3],
    left: spacing[3],
    right: spacing[3],
  },
}));

export default LoginScreen;