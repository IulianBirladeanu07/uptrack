import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { getAuth, EmailAuthProvider, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { deleteAccount } from '../../services/accountDeletionService';
import { createAppleSignInNonce } from '../../../auth/utils/appleSignInNonce';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

type AuthError = Error & { code?: string };

const errorMessage = (e: AuthError) => {
  switch (e.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong password.';
    case 'auth/user-mismatch':
      return 'Choose the same account you signed in with.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'No connection. Try again.';
    default:
      return 'Deletion did not finish. Try again.';
  }
};

const DeleteAccountModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const user = getAuth().currentUser;
  const usesPassword = !!user?.providerData.some(p => p.providerId === 'password');
  const usesApple = !!user?.providerData.some(p => p.providerId === 'apple.com');
  const canDelete = !busy && (!usesPassword || password.length > 0);

  const close = () => {
    if (busy) return;
    setPassword('');
    setError('');
    onClose();
  };

  const getCredential = async () => {
    if (usesPassword) return EmailAuthProvider.credential(user!.email!, password);

    if (usesApple) {
      const { rawNonce, hashedNonce } = await createAppleSignInNonce();
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) throw new Error('No identity token received');
      return new OAuthProvider('apple.com').credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
    }

    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();
    const info = await GoogleSignin.signIn();
    const idToken = info.data?.idToken;
    if (!idToken) throw new Error('No id_token received');
    return GoogleAuthProvider.credential(idToken);
  };

  const confirmHint = usesPassword
    ? null
    : usesApple
      ? 'You will be asked to confirm with Apple.'
      : 'You will be asked to confirm with Google.';

  const handleDelete = async () => {
    if (!user || !canDelete) return;
    setBusy(true);
    setError('');
    try {
      const credential = await getCredential();
      await deleteAccount(user, credential);
    } catch (e) {
      const code = (e as AuthError).code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === 'ERR_REQUEST_CANCELED') {
        setBusy(false);
        return;
      }
      setError(errorMessage(e as AuthError));
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.card}>
          <Text style={styles.title}>Delete account</Text>
          <Text style={styles.body}>
            This permanently deletes your account and everything in it: meals, workouts, templates, splits, measurements and your profile. It cannot be undone.
          </Text>
          {usesPassword ? (
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              placeholder="Password"
              placeholderTextColor={colors.text.quaternary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          ) : (
            <Text style={styles.hint}>{confirmHint}</Text>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={close} disabled={busy} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.deleteBtn, !canDelete && styles.deleteBtnDisabled]} onPress={handleDelete} disabled={!canDelete} activeOpacity={0.8}>
              {busy ? <ActivityIndicator size="small" color={colors.accent.buttonText} /> : <Text style={styles.deleteText}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = createStyles(() => ({
  root:             { flex: 1, justifyContent: 'center', paddingHorizontal: spacing[5] },
  backdrop:         { ...({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const), backgroundColor: 'rgba(0,0,0,0.55)' },
  card:             { backgroundColor: colors.background.secondary, borderRadius: radius[5], padding: spacing[5], borderWidth: 1, borderColor: colors.border.default },
  title:            { fontSize: fontSize[20], fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: spacing[2] },
  body:             { fontSize: fontSize[14], color: colors.text.secondary, lineHeight: fontSize[20], marginBottom: spacing[4] },
  hint:             { fontSize: fontSize[12], color: colors.text.tertiary, marginBottom: spacing[3] },
  input:            { borderWidth: 1, borderColor: colors.border.default, borderRadius: radius[3], paddingHorizontal: spacing[3], paddingVertical: spacing[3], color: colors.text.primary, marginBottom: spacing[3], backgroundColor: colors.background.primary },
  error:            { color: colors.accent.error, fontSize: fontSize[12], marginBottom: spacing[3] },
  actions:          { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  btn:              { flex: 1, height: spacing.buttonHeight, borderRadius: radius[4], alignItems: 'center', justifyContent: 'center' },
  cancelBtn:        { backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
  cancelText:       { fontSize: fontSize[16], fontWeight: fontWeight.semibold, color: colors.text.primary },
  deleteBtn:        { backgroundColor: colors.accent.error },
  deleteBtnDisabled:{ opacity: 0.4 },
  deleteText:       { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText },
}));

export default DeleteAccountModal;
