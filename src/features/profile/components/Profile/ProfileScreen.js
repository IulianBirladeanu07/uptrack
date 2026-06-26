import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { fetchUserProfile } from '../../../auth/services/firebaseAuthService';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { AuthContext } from '../../../auth/context/AuthContext';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const PLACEHOLDER_URI = 'https://via.placeholder.com/150';

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

  const auth = getAuth();
  const db = getFirestore();

  const [profilePicture, setProfilePicture] = useState(userSettings?.profilePicture || PLACEHOLDER_URI);
  const [username, setUsername] = useState(userSettings?.username || '');
  const [email, setEmail] = useState(userSettings?.email || '');
  const [age, setAge] = useState(String(userSettings?.age || ''));
  const [weight, setWeight] = useState(String(userSettings?.weight || ''));
  const [height, setHeight] = useState(String(userSettings?.height || ''));
  const [dob, setDob] = useState(userSettings?.dob ? new Date(userSettings.dob) : new Date());
  const [targetCalories, setTargetCalories] = useState(String(userSettings?.targetCalories || ''));
  const [targetProtein, setTargetProtein] = useState(String(userSettings?.targetProtein || ''));
  const [targetFats, setTargetFats] = useState(String(userSettings?.targetFats || ''));
  const [targetCarbs, setTargetCarbs] = useState(String(userSettings?.targetCarbs || ''));

  const [showDatePicker, setShowDatePicker] = useState(false);
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
          setProfilePicture(data.profilePicture || PLACEHOLDER_URI);
          setUsername(data.username || '');
          setEmail(data.email || '');
          setAge(String(data.age || ''));
          setWeight(String(data.weight || ''));
          setHeight(String(data.height || ''));
          setDob(data.dob ? new Date(data.dob) : new Date());
          setTargetCalories(String(data.targetCalories || ''));
          setTargetProtein(String(data.targetProtein || ''));
          setTargetFats(String(data.targetFats || ''));
          setTargetCarbs(String(data.targetCarbs || ''));
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
    if (!age.trim() || isNaN(age) || Number(age) <= 0) e.age = 'Valid age required';
    if (!weight.trim() || isNaN(weight) || Number(weight) <= 0) e.weight = 'Valid weight required';
    if (!height.trim() || isNaN(height) || Number(height) <= 0) e.height = 'Valid height required';
    if (!targetCalories.trim() || isNaN(targetCalories) || Number(targetCalories) <= 0) e.targetCalories = 'Required';
    if (!targetProtein.trim() || isNaN(targetProtein) || Number(targetProtein) <= 0) e.targetProtein = 'Required';
    if (!targetFats.trim() || isNaN(targetFats) || Number(targetFats) <= 0) e.targetFats = 'Required';
    if (!targetCarbs.trim() || isNaN(targetCarbs) || Number(targetCarbs) <= 0) e.targetCarbs = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    const profileData = {
      profilePicture,
      username,
      email,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      dob: dob.toISOString(),
      targetCalories: Number(targetCalories),
      targetProtein: Number(targetProtein),
      targetFats: Number(targetFats),
      targetCarbs: Number(targetCarbs),
    };
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      setUserSettings(profileData);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    const s = userSettings || {};
    setProfilePicture(s.profilePicture || PLACEHOLDER_URI);
    setUsername(s.username || '');
    setEmail(s.email || '');
    setAge(String(s.age || ''));
    setWeight(String(s.weight || ''));
    setHeight(String(s.height || ''));
    setDob(s.dob ? new Date(s.dob) : new Date());
    setTargetCalories(String(s.targetCalories || ''));
    setTargetProtein(String(s.targetProtein || ''));
    setTargetFats(String(s.targetFats || ''));
    setTargetCarbs(String(s.targetCarbs || ''));
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
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

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
        contentContainerStyle={styles.scrollContent}
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
            <Image source={{ uri: profilePicture }} style={styles.avatar} />
            {isEditing && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={spacing.iconSm} color={colors.text.primary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarUsername}>{username || 'Your Name'}</Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

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

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing[2] }}>
            <Field
              label="Age"
              icon={<Ionicons name="calendar-outline" size={spacing.icon} color={colors.text.tertiary} />}
              value={`${age} yrs`}
              error={errors.age}
            >
              {isEditing && (
                <TextInput
                  style={[styles.textInput, errors.age && styles.textInputError]}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  placeholderTextColor={colors.text.quaternary}
                  keyboardType="numeric"
                />
              )}
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Weight"
              icon={<Ionicons name="barbell-outline" size={spacing.icon} color={colors.text.tertiary} />}
              value={`${weight} kg`}
              error={errors.weight}
            >
              {isEditing && (
                <TextInput
                  style={[styles.textInput, errors.weight && styles.textInputError]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="kg"
                  placeholderTextColor={colors.text.quaternary}
                  keyboardType="numeric"
                />
              )}
            </Field>
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing[2] }}>
            <Field
              label="Height"
              icon={<Ionicons name="resize-outline" size={spacing.icon} color={colors.text.tertiary} />}
              value={`${height} cm`}
              error={errors.height}
            >
              {isEditing && (
                <TextInput
                  style={[styles.textInput, errors.height && styles.textInputError]}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="cm"
                  placeholderTextColor={colors.text.quaternary}
                  keyboardType="numeric"
                />
              )}
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Date of Birth"
              icon={<Ionicons name="calendar-outline" size={spacing.icon} color={colors.text.tertiary} />}
              value={dob.toLocaleDateString()}
              error={errors.dob}
            >
              {isEditing && (
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateValue}>{dob.toLocaleDateString()}</Text>
                </TouchableOpacity>
              )}
            </Field>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setDob(date);
            }}
          />
        )}

        <SectionHeader title="Nutritional Targets" />

        <View style={styles.macroGrid}>
          <View style={[styles.macroCard, styles.macroCardCalories]}>
            <Ionicons name="flame-outline" size={spacing.iconMd} color={colors.accent.primary} />
            <Text style={styles.macroCardLabel}>Calories</Text>
            {isEditing ? (
              <TextInput
                style={[styles.macroInput, errors.targetCalories && styles.textInputError]}
                value={targetCalories}
                onChangeText={setTargetCalories}
                placeholder="0"
                placeholderTextColor={colors.text.quaternary}
                keyboardType="numeric"
                textAlign="center"
              />
            ) : (
              <Text style={styles.macroCardValue}>{targetCalories}</Text>
            )}
            <Text style={styles.macroCardUnit}>kcal</Text>
          </View>
        </View>

        <View style={styles.macroRow}>
          {[
            {
              key: 'targetProtein',
              label: 'Protein',
              value: targetProtein,
              setter: setTargetProtein,
              color: colors.accent.purpleLight,
              bg: colors.faded.purpleAlt,
              border: colors.border.protein,
              icon: 'nutrition-outline',
            },
            {
              key: 'targetCarbs',
              label: 'Carbs',
              value: targetCarbs,
              setter: setTargetCarbs,
              color: colors.accent.greenLight,
              bg: colors.faded.green,
              border: colors.border.carbs,
              icon: 'restaurant-outline',
            },
            {
              key: 'targetFats',
              label: 'Fats',
              value: targetFats,
              setter: setTargetFats,
              color: colors.accent.cyanLight,
              bg: colors.faded.cyanAlt,
              border: colors.border.fat,
              icon: 'fast-food-outline',
            },
          ].map(({ key, label, value, setter, color, bg, border, icon }) => (
            <View key={key} style={[styles.macroMini, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name={icon} size={spacing.icon} color={color} />
              <Text style={[styles.macroMiniLabel, { color }]}>{label}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.macroMiniInput, errors[key] && styles.textInputError, { color }]}
                  value={value}
                  onChangeText={setter}
                  placeholder="0"
                  placeholderTextColor={colors.text.quaternary}
                  keyboardType="numeric"
                  textAlign="center"
                />
              ) : (
                <Text style={[styles.macroMiniValue, { color }]}>{value}g</Text>
              )}
            </View>
          ))}
        </View>

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
    paddingTop: spacing[5],
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
    marginBottom: spacing[8],
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatar: {
    width: spacing[20],
    height: spacing[20],
    borderRadius: spacing[10],
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: spacing[7],
    height: spacing[7],
    borderRadius: spacing[4],
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  avatarUsername: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  avatarEmail: {
    fontSize: fontSize[14],
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  sectionHeader: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
    marginTop: spacing[2],
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
  dateValue: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize[12],
    color: colors.accent.error,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  row: {
    flexDirection: 'row',
  },
  macroGrid: {
    marginBottom: spacing[3],
  },
  macroCard: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[1],
  },
  macroCardCalories: {
    borderColor: colors.border.primary,
    backgroundColor: colors.faded.primaryLight,
  },
  macroCardLabel: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroCardValue: {
    fontSize: fontSize[32],
    fontWeight: fontWeight.black,
    color: colors.accent.primary,
    lineHeight: 38,
  },
  macroCardUnit: {
    fontSize: fontSize[12],
    color: colors.text.tertiary,
    fontWeight: fontWeight.medium,
  },
  macroInput: {
    fontSize: fontSize[32],
    fontWeight: fontWeight.black,
    color: colors.accent.primary,
    width: '100%',
    textAlign: 'center',
    padding: 0,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  macroMini: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius[3],
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[1],
  },
  macroMiniLabel: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroMiniValue: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.extrabold,
  },
  macroMiniInput: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.extrabold,
    width: '100%',
    textAlign: 'center',
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
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