import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const reauthenticate = async (currentPassword) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      const error = new Error('User not authenticated or email not found.');
      throw error;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      const result = await reauthenticateWithCredential(user, credential);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }

    setLoading(true);
    try {
      await reauthenticate(currentPassword);
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        navigation.goBack();
      } else {
        throw new Error('User not found.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={spacing[7]} color={colors.text.primary} />
      </TouchableOpacity>

      <Text style={styles.header}>Change Password</Text>

      <View style={styles.card}>
        <Ionicons name="lock-closed-outline" size={spacing.iconLg} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showCurrentPassword}
        />
        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
          <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={spacing.iconLg} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Ionicons name="lock-closed-outline" size={spacing.iconLg} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
          <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={spacing.iconLg} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Ionicons name="lock-closed-outline" size={spacing.iconLg} color={colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm New Password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={spacing.iconLg} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleChangePassword} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing[5],
  },
  backButton: {
    position: 'absolute',
    top: spacing[10],
    left: spacing[5],
    zIndex: 1,
  },
  header: {
    fontSize: fontSize[24],
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[16],
  },
  icon: {
    marginRight: spacing[3],
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: radius[4],
    marginTop: spacing[6],
    alignItems: 'center',
    shadowColor: colors.accent.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: colors.accent.buttonText,
    textAlign: 'center',
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
  },
}));

export default ChangePasswordScreen;