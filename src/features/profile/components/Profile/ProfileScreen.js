import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateEmail } from 'firebase/auth';
import { fetchUserProfile } from '../../../auth/services/firebaseAuthService';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { AuthContext } from '../../../auth/context/AuthContext';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const StatTile = ({ value, unit }) => (
  <View style={styles.statTile}>
    <Text style={styles.statValue}>{value || '-'}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
  </View>
);

const Field = ({ icon, label, value, error, children }) => (
  <View style={{ marginBottom: spacing[4] }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldCard, error && styles.fieldCardError]}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldContent}>{children || <Text style={styles.fieldValue}>{value}</Text>}</View>
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const ProfileScreen = ({ navigation }) => {
  const { setUserSettings, userSettings } = useContext(WorkoutContext);
  const { logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [profilePicture, setProfilePicture] = useState(userSettings?.profilePicture || null);
  const [pendingImageUri, setPendingImageUri] = useState(null);
  const [username, setUsername] = useState(userSettings?.username || '');
  const [email, setEmail] = useState(userSettings?.email || '');
  const [age, setAge] = useState(String(userSettings?.age || ''));
  const [weight, setWeight] = useState(String(userSettings?.currentWeight || ''));
  const [height, setHeight] = useState(String(userSettings?.height || ''));
  const [targetCalories, setTargetCalories] = useState(userSettings?.targetCalories || 0);
  const [targetProtein, setTargetProtein] = useState(userSettings?.targetProtein || 0);
  const [targetFats, setTargetFats] = useState(userSettings?.targetFats || 0);
  const [targetCarbs, setTargetCarbs] = useState(userSettings?.targetCarbs || 0);

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchUserProfile(user.uid);
        if (data) {
          setProfilePicture(data.profilePicture || null);
          setUsername(data.username || '');
          setEmail(data.email || '');
          setAge(String(data.age || ''));
          setWeight(String(data.currentWeight || ''));
          setHeight(String(data.height || ''));
          setTargetCalories(data.targetCalories || 0);
          setTargetProtein(data.targetProtein || 0);
          setTargetFats(data.targetFats || 0);
          setTargetCarbs(data.targetCarbs || 0);
          setUserSettings(data);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadProfilePicture = async (uid, uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const pictureRef = ref(storage, `profilePictures/${uid}.jpg`);
    await uploadBytes(pictureRef, blob);
    return getDownloadURL(pictureRef);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      let finalProfilePicture = profilePicture;
      if (pendingImageUri) {
        finalProfilePicture = await uploadProfilePicture(user.uid, pendingImageUri);
      }

      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (err) {
          if (err.code === 'auth/requires-recent-login') {
            Alert.alert('Re-authentication required', 'Log out and back in, then change your email again.');
            setSaving(false);
            return;
          }
          throw err;
        }
      }

      const profileData = {
        profilePicture: finalProfilePicture,
        username,
        email,
      };

      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      setProfilePicture(finalProfilePicture);
      setPendingImageUri(null);
      setUserSettings(prev => ({ ...prev, ...profileData }));
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    const s = userSettings || {};
    setProfilePicture(s.profilePicture || null);
    setPendingImageUri(null);
    setUsername(s.username || '');
    setEmail(s.email || '');
    setErrors({});
    setIsEditing(false);
  }, [userSettings]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
      setPendingImageUri(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const renderAvatarContent = () =>
    profilePicture ? (
      <Image source={{ uri: profilePicture }} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Ionicons name="person" size={spacing.iconLg} color={colors.text.tertiary} />
      </View>
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[2] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={spacing.iconLg} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={spacing.iconMd} color={colors.accent.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: spacing[9] }} />
          )}
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={isEditing ? pickImage : undefined}
            activeOpacity={isEditing ? 0.7 : 1}
            style={styles.avatarWrapper}
          >
            {renderAvatarContent()}
            {isEditing && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={spacing.iconSm} color={colors.text.primary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarUsername}>{username || 'Your Name'}</Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

        <View style={styles.statRow}>
          <StatTile value={age} unit="yrs" />
          <StatTile value={weight} unit="kg" />
          <StatTile value={height} unit="cm" />
        </View>
        <Text style={styles.statNote}>Physical stats managed in Settings</Text>

        <SectionHeader title="Personal Info" />

        <Field
          label="Username"
          icon={<Ionicons name="person-outline" size={spacing.icon} color={colors.text.tertiary} />}
          value={username}
          error={errors.username}
        >
          {isEditing && (
            <TextInput
              style={[styles.textInput, errors.username && styles.textInputError]}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.text.quaternary}
              autoCapitalize="none"
            />
          )}
        </Field>

        <Field
          label="Email"
          icon={<MaterialIcons name="email" size={spacing.icon} color={colors.text.tertiary} />}
          value={email}
          error={errors.email}
        >
          {isEditing && (
            <TextInput
              style={[styles.textInput, errors.email && styles.textInputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.text.quaternary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        </Field>

        <SectionHeader title="Nutrition Target" />

        <View style={styles.nutritionCard}>
          <View style={styles.nutritionKcalRow}>
            <Text style={styles.nutritionKcal}>{targetCalories}</Text>
            <Text style={styles.nutritionKcalUnit}>kcal / day</Text>
          </View>
          <View style={styles.nutritionMacroRow}>
            <View style={styles.nutritionMacroItem}>
              <Text style={styles.nutritionMacroLabel}>Protein</Text>
              <Text style={styles.nutritionMacroValue}>{targetProtein}g</Text>
            </View>
            <View style={styles.nutritionMacroItem}>
              <Text style={styles.nutritionMacroLabel}>Carbs</Text>
              <Text style={styles.nutritionMacroValue}>{targetCarbs}g</Text>
            </View>
            <View style={styles.nutritionMacroItem}>
              <Text style={styles.nutritionMacroLabel}>Fat</Text>
              <Text style={styles.nutritionMacroValue}>{targetFats}g</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsLink}>Managed in Settings</Text>
        </TouchableOpacity>

        {isEditing && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.accent.buttonText} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.separator} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={spacing.icon} color={colors.accent.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = createStyles(() => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[12],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
  },
  backButton: {
    width: spacing[9],
    height: spacing[9],
    borderRadius: radius[3],
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  editButton: {
    width: spacing[9],
    height: spacing[9],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatar: {
    width: spacing[18],
    height: spacing[18],
    borderRadius: spacing[9],
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  avatarFallback: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: spacing[6],
    height: spacing[6],
    borderRadius: spacing[3],
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  avatarUsername: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  avatarEmail: {
    fontSize: fontSize[12],
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statUnit: {
    fontSize: fontSize[10],
    color: colors.text.quaternary,
    marginTop: spacing[1],
  },
  statNote: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
    marginTop: spacing[6],
  },
  fieldLabel: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  fieldCardError: {
    borderColor: colors.accent.error,
  },
  fieldIcon: {
    width: spacing[6],
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldValue: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  textInput: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    padding: 0,
  },
  textInputError: {
    color: colors.accent.error,
  },
  errorText: {
    fontSize: fontSize[12],
    color: colors.accent.error,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  nutritionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
  },
  nutritionKcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  nutritionKcal: {
    fontSize: fontSize[28],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
  },
  nutritionKcalUnit: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
  },
  nutritionMacroRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing[3],
  },
  nutritionMacroItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionMacroLabel: {
    fontSize: fontSize[10],
    color: colors.text.quaternary,
    marginBottom: spacing[1],
  },
  nutritionMacroValue: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  settingsLink: {
    fontSize: fontSize[12],
    color: colors.accent.cyan,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent.primary,
    borderRadius: radius[4],
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: colors.accent.buttonText,
    fontWeight: fontWeight.bold,
    fontSize: fontSize[16],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize[16],
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing[4],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.faded.errorAlt,
    borderRadius: radius[4],
    height: spacing.buttonHeight,
    borderWidth: 1,
    borderColor: colors.border.error,
  },
  logoutText: {
    color: colors.accent.error,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize[16],
  },
}));

export default ProfileScreen;