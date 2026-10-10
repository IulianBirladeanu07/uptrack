import { useState, useContext, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateEmail } from 'firebase/auth';
import { db } from '../../../auth/services/firebaseConfigService';
import { AuthContext } from '../../../auth/context/AuthContext';
import { buildPlanUpdate, planView, changedFields } from '../../utils/planUpdate';
import { OptionRow, NumberStepper } from '../../../../shared/components/FormControls/FormControls';
import { ACTIVITY_OPTIONS, EXPERIENCE_OPTIONS, STRESS_OPTIONS } from '../../utils/profileOptions';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const InputRow = ({ label, error, ...props }) => (
  <View>
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.text.quaternary}
        {...props}
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { userData, refreshUserData, logout } = useContext(AuthContext);
  const auth = getAuth();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    age:               userData?.age               || 24,
    height:            userData?.height             || 175,
    gender:            userData?.gender             || 'male',
    currentWeight:     userData?.currentWeight      || 80,
    targetWeight:      userData?.targetWeight       || 80,
    activityLevel:     userData?.activityLevel      || 'moderately_active',
    experienceLevel:   userData?.experienceLevel    || 'intermediate',
    stressLevel:       userData?.stressLevel        || 'moderate',
    autoAdjustEnabled: userData?.autoAdjustEnabled  ?? true,
  });
  const [original, setOriginal] = useState({ ...form });

  const [identity, setIdentity] = useState({
    username: userData?.username || '',
    email:    userData?.email || auth.currentUser?.email || '',
  });
  const [savedIdentity, setSavedIdentity] = useState({ ...identity });
  const [picture, setPicture] = useState(userData?.profilePicture || null);
  const [pendingUri, setPendingUri] = useState(null);

  const planCount = Object.keys(changedFields(form, original)).length;
  const identityCount = ['username', 'email'].filter(k => identity[k] !== savedIdentity[k]).length + (pendingUri ? 1 : 0);
  const changedCount = planCount + identityCount;
  const hasChanges = changedCount > 0;

  const update = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateIdentity = useCallback((key, value) => {
    setIdentity(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  const stepValue = useCallback((key, delta, min, max, decimals = 0) => {
    setForm(prev => {
      const next = parseFloat((prev[key] + delta).toFixed(decimals));
      return { ...prev, [key]: Math.min(max, Math.max(min, next)) };
    });
  }, []);

  const view = planView({ userData, form, original });
  const previewGoal = view.goal;
  const currentPlan = view.base;
  const previewPlan = view.next;
  const isGaining = previewGoal === 'muscle_gain';
  const calDiff = previewPlan.goalCalories - currentPlan.goalCalories;
  const planChanged = planCount > 0;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPicture(result.assets[0].uri);
      setPendingUri(result.assets[0].uri);
    }
  };

  const uploadPicture = async (uid, uri) => {
    const blob = await (await fetch(uri)).blob();
    const pictureRef = ref(getStorage(), `profilePictures/${uid}.jpg`);
    await uploadBytes(pictureRef, blob, { contentType: blob.type || 'image/jpeg' });
    const url = await getDownloadURL(pictureRef);
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
  };

  const validate = () => {
    const e = {};
    if (!identity.username.trim()) e.username = 'Required';
    if (!EMAIL_RE.test(identity.email.trim())) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    setSaving(true);
    try {
      const username = identity.username.trim();
      const email = identity.email.trim();
      const payload = planChanged
        ? buildPlanUpdate({ userData, form, original, now: new Date().toISOString() })
        : {};

      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (err) {
          if (err.code === 'auth/requires-recent-login') {
            Alert.alert('Re-authentication required', 'Log out and back in, then change your email again.');
            return;
          }
          throw err;
        }
      }

      if (username !== savedIdentity.username) payload.username = username;
      if (email !== savedIdentity.email) payload.email = email;
      if (pendingUri) payload.profilePicture = await uploadPicture(user.uid, pendingUri);

      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      await refreshUserData();

      setOriginal({ ...form });
      setIdentity({ username, email });
      setSavedIdentity({ username, email });
      if (payload.profilePicture) setPicture(payload.profilePicture);
      setPendingUri(null);
      Alert.alert('Done', planChanged ? 'Your plan has been updated.' : 'Profile updated.');
    } catch (err) {
      console.error('Profile save error:', err);
      Alert.alert('Error', 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!hasChanges || !validate()) return;
    if (!planChanged) {
      persist();
      return;
    }
    Alert.alert(
      'Update Plan',
      view.replan
        ? 'This will recalculate your calorie and macro targets. Continue?'
        : 'Your calorie and macro targets stay as learned from your data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: persist },
      ]
    );
  };

  const handleBack = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing[24] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7} style={styles.avatarWrapper}>
            {picture ? (
              <Image source={{ uri: picture }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={spacing.iconLg} color={colors.text.tertiary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={spacing.iconSm} color={colors.accent.buttonText} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{identity.username || 'Your Name'}</Text>
        </View>

        <View style={[styles.hero, planChanged && styles.heroActive]}>
          <View style={styles.heroHeader}>
            <View style={[styles.goalTag, { backgroundColor: isGaining ? colors.faded.success : colors.faded.primary }]}>
              <Text style={[styles.goalTagText, { color: isGaining ? colors.accent.success : colors.accent.primary }]}>
                {isGaining ? 'Muscle Gain' : previewGoal === 'maintenance' ? 'Maintenance' : 'Cut'}
              </Text>
            </View>
            {planChanged && (
              <Text style={styles.heroChangedHint}>
                {planCount} change{planCount > 1 ? 's' : ''} pending
              </Text>
            )}
          </View>

          <View style={styles.heroKcalRow}>
            <View style={styles.heroKcalCol}>
              <Text style={styles.heroColLabel}>NOW</Text>
              <Text style={styles.heroKcalOld}>{currentPlan.goalCalories}</Text>
            </View>

            <View style={styles.heroArrow}>
              {planChanged && calDiff !== 0 ? (
                <View style={[styles.heroDiffBadge, { backgroundColor: calDiff > 0 ? colors.faded.success : colors.faded.error }]}>
                  <Text style={[styles.heroDiffText, { color: calDiff > 0 ? colors.accent.success : colors.accent.error }]}>
                    {calDiff > 0 ? '+' : ''}{calDiff}
                  </Text>
                </View>
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.text.quaternary} />
              )}
            </View>

            <View style={styles.heroKcalCol}>
              <Text style={[styles.heroColLabel, planChanged && { color: colors.accent.primary }]}>NEW</Text>
              <Text style={[styles.heroKcalNew, planChanged && { color: colors.text.primary }]}>
                {previewPlan.goalCalories}
              </Text>
            </View>
          </View>

          <Text style={styles.heroKcalUnit}>kcal / day</Text>

          <View style={styles.heroMacros}>
            {[
              { label: 'P', old: currentPlan.macros.protein, next: previewPlan.macros.protein, color: colors.accent.purple  },
              { label: 'C', old: currentPlan.macros.carbs,   next: previewPlan.macros.carbs,   color: colors.accent.success },
              { label: 'F', old: currentPlan.macros.fats,    next: previewPlan.macros.fats,    color: colors.accent.cyan    },
            ].map((m, i, arr) => {
              const diff = m.next - m.old;
              return (
                <View key={m.label} style={[styles.heroMacroItem, i < arr.length - 1 && styles.heroMacroBorder]}>
                  <View style={[styles.heroMacroDot, { backgroundColor: m.color }]} />
                  <Text style={styles.heroMacroLabel}>{m.label}</Text>
                  <Text style={[styles.heroMacroVal, planChanged && { color: colors.text.primary }]}>{m.next}g</Text>
                  {planChanged && diff !== 0 && (
                    <Text style={[styles.heroMacroDiff, { color: diff > 0 ? colors.accent.success : colors.accent.error }]}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}g
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroRate}>
              {previewPlan.ratePerWeek > 0
                ? `${isGaining ? '+' : '-'}${previewPlan.ratePerWeek} kg/week · ~${previewPlan.weeksToGoal} weeks to goal`
                : 'Maintenance'}
            </Text>
            {!view.replan && planChanged && (
              <Text style={styles.heroRate}>Targets stay as learned from your data</Text>
            )}
          </View>
        </View>

        <SectionTitle>Account</SectionTitle>
        <View style={styles.card}>
          <InputRow
            label="Username"
            value={identity.username}
            onChangeText={v => updateIdentity('username', v)}
            placeholder="Username"
            autoCapitalize="none"
            error={errors.username}
          />
          <View style={styles.divider} />
          <InputRow
            label="Email"
            value={identity.email}
            onChangeText={v => updateIdentity('email', v)}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </View>

        <SectionTitle>Personal</SectionTitle>
        <View style={styles.card}>
          <NumberStepper label="Age"    value={form.age}    unit="yrs" onDecrement={() => stepValue('age',    -1,  16,  80)} onIncrement={() => stepValue('age',    1,  16,  80)} />
          <View style={styles.divider} />
          <NumberStepper label="Height" value={form.height} unit="cm"  onDecrement={() => stepValue('height', -1, 120, 250)} onIncrement={() => stepValue('height', 1, 120, 250)} />
          <View style={styles.divider} />
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Gender</Text>
            <View style={styles.genderToggle}>
              {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderBtn, form.gender === opt.value && styles.genderBtnSelected]}
                  onPress={() => update('gender', opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderBtnText, form.gender === opt.value && styles.genderBtnTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <SectionTitle>Weight</SectionTitle>
        <View style={styles.card}>
          <NumberStepper label="Current" value={form.currentWeight} unit="kg" onDecrement={() => stepValue('currentWeight', -0.1, 30, 300, 1)} onIncrement={() => stepValue('currentWeight', 0.1, 30, 300, 1)} />
          <View style={styles.divider} />
          <NumberStepper label="Target"  value={form.targetWeight}  unit="kg" onDecrement={() => stepValue('targetWeight',  -0.1, 30, 300, 1)} onIncrement={() => stepValue('targetWeight',  0.1, 30, 300, 1)} />
        </View>

        <SectionTitle>Activity Level</SectionTitle>
        <View style={styles.card}>
          {ACTIVITY_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.activityLevel === opt.value} onPress={v => update('activityLevel', v)} />
              {i < ACTIVITY_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Training Experience</SectionTitle>
        <View style={styles.card}>
          {EXPERIENCE_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.experienceLevel === opt.value} onPress={v => update('experienceLevel', v)} />
              {i < EXPERIENCE_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Stress Level</SectionTitle>
        <View style={styles.card}>
          {STRESS_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.stressLevel === opt.value} onPress={v => update('stressLevel', v)} />
              {i < STRESS_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Automation</SectionTitle>
        <View style={styles.card}>
          <View style={styles.stepperRow}>
            <View style={styles.automationTextCol}>
              <Text style={styles.stepperLabel}>Auto-Adjust Calories</Text>
              <Text style={styles.optionDesc}>Weekly targets update automatically based on your progress</Text>
            </View>
            <Switch
              value={form.autoAdjustEnabled}
              onValueChange={v => update('autoAdjustEnabled', v)}
              trackColor={{ false: colors.background.tertiary, true: colors.faded.primary }}
              thumbColor={form.autoAdjustEnabled ? colors.accent.primary : colors.text.quaternary}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={spacing.icon} color={colors.accent.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!hasChanges || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.accent.buttonText} />
            : <Text style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDisabled]}>
                {hasChanges ? `Save · ${changedCount} change${changedCount > 1 ? 's' : ''}` : 'No Changes'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  root:                { flex: 1, backgroundColor: colors.background.primary },
  topBar:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[3] },
  backBtn:             { width: spacing[10], height: spacing[10], borderRadius: radius[3], backgroundColor: colors.background.secondary, justifyContent: 'center', alignItems: 'center' },
  topBarTitle:         { fontSize: fontSize[22], fontWeight: fontWeight.bold, color: colors.text.primary, flex: 1 },
  topBarRight:         { width: spacing[10] },
  scroll:              { flex: 1 },
  scrollContent:       { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  avatarSection:       { alignItems: 'center', marginBottom: spacing[5] },
  avatarWrapper:       { position: 'relative', marginBottom: spacing[3] },
  avatar:              { width: spacing[18], height: spacing[18], borderRadius: spacing[9], borderWidth: 2, borderColor: colors.border.primary },
  avatarFallback:      { backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge:     { position: 'absolute', bottom: 0, right: 0, width: spacing[6], height: spacing[6], borderRadius: spacing[3], backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background.primary },
  avatarName:          { fontSize: fontSize[18], fontWeight: fontWeight.bold, color: colors.text.primary },
  hero:                { backgroundColor: colors.background.secondary, borderRadius: radius[4], padding: spacing[5], marginBottom: spacing[5], borderWidth: 1, borderColor: colors.border.default },
  heroActive:          { borderColor: colors.border.primary },
  heroHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5] },
  goalTag:             { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius[2] },
  goalTagText:         { fontSize: fontSize[12], fontWeight: fontWeight.bold },
  heroChangedHint:     { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.tertiary },
  heroKcalRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[5], marginBottom: spacing[1] },
  heroKcalCol:         { alignItems: 'center', flex: 1 },
  heroColLabel:        { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, letterSpacing: 1.5, marginBottom: spacing[2] },
  heroKcalOld:         { fontSize: fontSize[36], fontWeight: fontWeight.extrabold, color: colors.text.quaternary },
  heroKcalNew:         { fontSize: fontSize[36], fontWeight: fontWeight.extrabold, color: colors.text.quaternary },
  heroArrow:           { alignItems: 'center', justifyContent: 'center', width: spacing[12] },
  heroDiffBadge:       { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius[2] },
  heroDiffText:        { fontSize: fontSize[14], fontWeight: fontWeight.extrabold },
  heroKcalUnit:        { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary, textAlign: 'center', marginBottom: spacing[5] },
  heroMacros:          { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[4], marginBottom: spacing[4] },
  heroMacroItem:       { flex: 1, alignItems: 'center', gap: spacing[1] },
  heroMacroBorder:     { borderRightWidth: 1, borderRightColor: colors.border.default },
  heroMacroDot:        { width: spacing[2], height: spacing[2], borderRadius: radius[1] },
  heroMacroLabel:      { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, letterSpacing: 1 },
  heroMacroVal:        { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.quaternary },
  heroMacroDiff:       { fontSize: fontSize[10], fontWeight: fontWeight.bold },
  heroFooter:          { borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[3] },
  heroRate:            { fontSize: fontSize[12], color: colors.text.secondary, textAlign: 'center', fontWeight: fontWeight.medium },
  sectionTitle:        { fontSize: fontSize[20], fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: spacing[3], marginTop: spacing[2] },
  card:                { backgroundColor: colors.background.secondary, borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden', marginBottom: spacing[4] },
  divider:             { height: 1, backgroundColor: colors.border.default, marginHorizontal: spacing[4] },
  stepperRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  stepperLabel:        { fontSize: fontSize[16], fontWeight: fontWeight.semibold, color: colors.text.primary },
  input:               { flex: 1, marginLeft: spacing[4], padding: 0, textAlign: 'right', fontSize: fontSize[16], fontWeight: fontWeight.medium, color: colors.text.primary },
  inputError:          { color: colors.accent.error },
  errorText:           { fontSize: fontSize[12], color: colors.accent.error, paddingHorizontal: spacing[4], paddingBottom: spacing[3], textAlign: 'right' },
  genderToggle:        { flexDirection: 'row', gap: spacing[2] },
  genderBtn:           { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius[3], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
  genderBtnSelected:   { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
  genderBtnText:       { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.tertiary },
  genderBtnTextSelected: { color: colors.accent.buttonText, fontWeight: fontWeight.bold },
  optionDesc:          { fontSize: fontSize[12], color: colors.text.quaternary, fontWeight: fontWeight.medium, marginTop: spacing[1] },
  automationTextCol:   { flex: 1, paddingRight: spacing[4] },
  logoutButton:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.faded.errorAlt, borderRadius: radius[4], height: spacing.buttonHeight, borderWidth: 1, borderColor: colors.border.error, marginTop: spacing[2] },
  logoutText:          { color: colors.accent.error, fontWeight: fontWeight.semibold, fontSize: fontSize[16] },
  footer:              { paddingHorizontal: spacing[4], paddingTop: spacing[3], backgroundColor: colors.background.primary },
  saveBtn:             { backgroundColor: colors.accent.primary, borderRadius: radius[4], paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled:     { backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.border.default },
  saveBtnText:         { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.accent.buttonText },
  saveBtnTextDisabled: { color: colors.text.quaternary },
}));

export default ProfileScreen;
