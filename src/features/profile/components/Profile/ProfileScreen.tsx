import { useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, Linking } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAuth } from 'firebase/auth';
import { AuthContext } from '../../../auth/context/AuthContext';
import { isTargetWeightOnlyChange, planView, changedFields } from '../../utils/planUpdate';
import DeleteAccountModal from './DeleteAccountModal';
import { OptionRow, NumberStepper } from '../../../../shared/components/FormControls/FormControls';
import { ACTIVITY_OPTIONS, EXPERIENCE_OPTIONS, STRESS_OPTIONS } from '../../utils/profileOptions';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { useProfileFormState } from './useProfileFormState';
import type { ProfileIdentityErrors } from './useProfileFormState';
import { useProfileSave } from './useProfileSave';
import { privacyPolicyUrl, accountDeletionUrl } from '../../../../shared/services/legalUrls';
import type { AuthenticatedStackParamList } from '../../../../shared/navigation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InputRowProps = TextInputProps & { label: string; error?: string | undefined };

const SectionTitle = ({ children }: { children: ReactNode }) => <Text style={styles.sectionTitle}>{children}</Text>;

const InputRow = ({ label, error, ...props }: InputRowProps) => (
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

const ProfileScreen = ({ navigation }: NativeStackScreenProps<AuthenticatedStackParamList, 'Profile'>) => {
  const insets = useSafeAreaInsets();
  const { userData, refreshUserData, logout } = useContext(AuthContext)!;
  const auth = getAuth();
  const isPasswordAccount = !!auth.currentUser?.providerData.some(p => p.providerId === 'password');
  const {
    form,
    original,
    setOriginal,
    identity,
    setIdentity,
    savedIdentity,
    setSavedIdentity,
    picture,
    setPicture,
    pendingUri,
    setPendingUri,
    errors,
    setErrors,
    nutritionError,
    planCount,
    changedCount,
    hasChanges,
    update,
    updateIdentity,
    stepValue,
    stepNutritionValue,
  } = useProfileFormState(userData, auth.currentUser?.email);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const view = planView({ userData, form, original });
  const previewGoal = view.goal;
  const currentPlan = view.base;
  const previewPlan = view.next;
  const isGaining = previewGoal === 'muscle_gain';
  const savedGoal = userData?.weightChangePlan?.type ?? userData?.fitnessGoals ?? original.fitnessGoals;
  const phaseChanged = previewGoal !== savedGoal;
  const calDiff = previewPlan.goalCalories - currentPlan.goalCalories;
  const planChanged = planCount > 0;
  const formDiff = changedFields(form, original);
  const targetWeightOnly = isTargetWeightOnlyChange(formDiff);
  const nutritionChanged = ['targetCalories', 'targetProtein', 'targetCarbs', 'targetFats']
    .some(key => Object.prototype.hasOwnProperty.call(formDiff, key));
  const { saving, persist } = useProfileSave({
    auth,
    isPasswordAccount,
    userData,
    form,
    original,
    identity,
    savedIdentity,
    pendingUri,
    planChanged,
    refreshUserData,
    setOriginal,
    setIdentity,
    setSavedIdentity,
    setPicture,
    setPendingUri,
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPicture(result.assets[0].uri);
      setPendingUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const e: ProfileIdentityErrors = {};
    if (!identity.username.trim()) e.username = 'Required';
    if (!EMAIL_RE.test(identity.email.trim())) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!hasChanges || !validate()) return;
    if (!planChanged) {
      persist();
      return;
    }
    Alert.alert(
      'Update Plan',
      targetWeightOnly
        ? 'This changes only your target weight. Your calorie and macro targets and other plan settings will stay unchanged. Continue?'
        : view.replan
        ? phaseChanged
          ? 'This will switch your goal phase and recalculate the plan. Any calorie or macro edits will be applied to the new plan. Continue?'
          : 'This will recalculate the plan from your updated profile. Any calorie or macro edits will be applied. Continue?'
        : nutritionChanged
        ? 'Your calorie and macro edits will be saved while the learned plan settings are preserved. Continue?'
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
          <View style={styles.avatarIdentity}>
            <Text style={styles.avatarName}>{identity.username || 'Your Name'}</Text>
            <Text style={styles.avatarEmail} numberOfLines={1}>{identity.email || 'Add an email address'}</Text>
          </View>
        </View>

        <View style={[styles.hero, planChanged && styles.heroActive]}>
          <View style={styles.heroHeader}>
            <View style={[
              styles.goalTag,
              { backgroundColor: isGaining ? colors.faded.success : previewGoal === 'maintenance' ? colors.faded.cyan : colors.faded.primary },
            ]}>
              <Text style={[
                styles.goalTagText,
                { color: isGaining ? colors.accent.success : previewGoal === 'maintenance' ? colors.accent.cyan : colors.accent.primary },
              ]}>
                {isGaining ? 'Muscle Gain' : previewGoal === 'maintenance' ? 'Maintenance' : 'Cut'}
              </Text>
            </View>
            {planChanged && (
              <Text style={styles.heroChangedHint}>
                {planCount} change{planCount > 1 ? 's' : ''} pending
              </Text>
            )}
          </View>

          <View style={styles.heroTargetRow}>
            <View>
              <Text style={styles.heroColLabel}>DAILY CALORIE TARGET</Text>
              <View style={styles.heroTargetValueRow}>
                <Text style={styles.heroKcalNew}>{previewPlan.goalCalories}</Text>
                <Text style={styles.heroKcalUnit}>kcal</Text>
              </View>
            </View>
            {planChanged && calDiff !== 0 && (
              <View style={styles.heroTargetChange}>
                <View style={[
                  styles.heroDiffBadge,
                  { backgroundColor: calDiff > 0 ? colors.faded.success : colors.faded.error },
                ]}>
                  <Text style={[
                    styles.heroDiffText,
                    { color: calDiff > 0 ? colors.accent.success : colors.accent.error },
                  ]}>
                    {calDiff > 0 ? '+' : ''}{calDiff}
                  </Text>
                </View>
                <Text style={styles.heroCompare}>from {currentPlan.goalCalories} kcal</Text>
              </View>
            )}
          </View>

          <View style={styles.heroMacros}>
            {[
              { label: 'Protein', old: currentPlan.macros.protein, next: previewPlan.macros.protein },
              { label: 'Carbs', old: currentPlan.macros.carbs, next: previewPlan.macros.carbs },
              { label: 'Fat', old: currentPlan.macros.fats, next: previewPlan.macros.fats },
            ].map((m, i, arr) => {
              const diff = m.next - m.old;
              return (
                <View key={m.label} style={[styles.heroMacroItem, i < arr.length - 1 && styles.heroMacroBorder]}>
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
              <Text style={styles.heroRate}>
                {targetWeightOnly
                  ? 'Calorie and macro targets stay unchanged'
                  : nutritionChanged
                  ? 'Manual calorie and macro targets'
                  : 'Targets stay as learned from your data'}
              </Text>
            )}
          </View>
        </View>

        <SectionTitle>Goal Phase</SectionTitle>
        <View style={styles.card}>
          {[
            { label: 'Weight loss', value: 'weight_loss', desc: 'Set a calorie deficit and track progress toward losing weight.' },
            { label: 'Muscle gain', value: 'muscle_gain', desc: 'Set a calorie surplus to support gradual muscle gain.' },
            { label: 'Maintenance', value: 'maintenance', desc: 'Maintain your current weight and nutrition targets.' },
          ].map((option, index, options) => (
            <View key={option.value}>
              <OptionRow
                option={option}
                selected={form.fitnessGoals === option.value}
                onPress={value => update('fitnessGoals', value)}
              />
              {index < options.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Weight</SectionTitle>
        <View style={styles.card}>
          <NumberStepper label="Current" value={form.currentWeight} unit="kg" onDecrement={() => stepValue('currentWeight', -0.1, 30, 300, 1)} onIncrement={() => stepValue('currentWeight', 0.1, 30, 300, 1)} />
          <View style={styles.divider} />
          <NumberStepper label="Target"  value={form.targetWeight}  unit="kg" onDecrement={() => stepValue('targetWeight',  -0.1, 30, 300, 1)} onIncrement={() => stepValue('targetWeight',  0.1, 30, 300, 1)} />
        </View>

        <SectionTitle>Nutrition Targets</SectionTitle>
        <View style={styles.card}>
          <NumberStepper
            label="Calories"
            value={form.targetCalories}
            unit="kcal"
            onDecrement={() => stepNutritionValue('targetCalories', -25)}
            onIncrement={() => stepNutritionValue('targetCalories', 25)}
          />
          <View style={styles.divider} />
          <NumberStepper label="Protein" value={form.targetProtein} unit="g" onDecrement={() => stepNutritionValue('targetProtein', -5)} onIncrement={() => stepNutritionValue('targetProtein', 5)} />
          <View style={styles.divider} />
          <NumberStepper label="Carbs" value={form.targetCarbs} unit="g" onDecrement={() => stepNutritionValue('targetCarbs', -5)} onIncrement={() => stepNutritionValue('targetCarbs', 5)} />
          <View style={styles.divider} />
          <NumberStepper label="Fat" value={form.targetFats} unit="g" onDecrement={() => stepNutritionValue('targetFats', -5)} onIncrement={() => stepNutritionValue('targetFats', 5)} />
          {nutritionError ? <Text style={styles.errorText}>{nutritionError}</Text> : null}
          <Text style={styles.nutritionHint}>
            Changing calories redistributes macros proportionally. Changing a macro balances the other two within your calorie target.
          </Text>
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
            editable={isPasswordAccount}
            error={errors.email}
          />
        </View>

        <SectionTitle>Activity Level</SectionTitle>
        <View style={styles.card}>
          {ACTIVITY_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.activityLevel === opt.value} onPress={(v: string) => update('activityLevel', v)} />
              {i < ACTIVITY_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Training Experience</SectionTitle>
        <View style={styles.card}>
          {EXPERIENCE_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.experienceLevel === opt.value} onPress={(v: string) => update('experienceLevel', v)} />
              {i < EXPERIENCE_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <SectionTitle>Stress Level</SectionTitle>
        <View style={styles.card}>
          {STRESS_OPTIONS.map((opt, i) => (
            <View key={opt.value}>
              <OptionRow option={opt} selected={form.stressLevel === opt.value} onPress={(v: string) => update('stressLevel', v)} />
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

        {isPasswordAccount && (
          <>
            <SectionTitle>Security</SectionTitle>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.stepperRow}
                onPress={() => navigation.navigate('ChangePassword')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Change password"
              >
                <Text style={styles.stepperLabel}>Change Password</Text>
                <Ionicons name="chevron-forward" size={spacing.icon} color={colors.text.quaternary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {(privacyPolicyUrl || accountDeletionUrl) ? (
          <>
            <SectionTitle>Legal</SectionTitle>
            <View style={styles.card}>
              {privacyPolicyUrl ? (
                <TouchableOpacity
                  style={styles.stepperRow}
                  onPress={() => { void Linking.openURL(privacyPolicyUrl); }}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel="Privacy policy"
                >
                  <Text style={styles.stepperLabel}>Privacy policy</Text>
                  <Ionicons name="open-outline" size={spacing.icon} color={colors.text.quaternary} />
                </TouchableOpacity>
              ) : null}
              {privacyPolicyUrl && accountDeletionUrl ? <View style={styles.divider} /> : null}
              {accountDeletionUrl ? (
                <TouchableOpacity
                  style={styles.stepperRow}
                  onPress={() => { void Linking.openURL(accountDeletionUrl); }}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel="Delete account on the web"
                >
                  <Text style={styles.stepperLabel}>Delete account on the web</Text>
                  <Ionicons name="open-outline" size={spacing.icon} color={colors.text.quaternary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={spacing.icon} color={colors.accent.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={() => setDeleteOpen(true)} activeOpacity={0.7}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <DeleteAccountModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} />

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
  avatarSection:       { flexDirection: 'row', alignItems: 'center', gap: spacing[4], marginBottom: spacing[4] },
  avatarWrapper:       { position: 'relative' },
  avatar:              { width: spacing[14], height: spacing[14], borderRadius: spacing[7], borderWidth: 2, borderColor: colors.border.primary },
  avatarFallback:      { backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge:     { position: 'absolute', bottom: 0, right: 0, width: spacing[6], height: spacing[6], borderRadius: spacing[3], backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background.primary },
  avatarIdentity:      { flex: 1, gap: spacing[1] },
  avatarName:          { fontSize: fontSize[20], fontWeight: fontWeight.bold, color: colors.text.primary },
  avatarEmail:         { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.tertiary },
  hero:                { backgroundColor: colors.background.secondary, borderRadius: radius[4], padding: spacing[4], marginBottom: spacing[4], borderWidth: 1, borderColor: colors.border.default },
  heroActive:          { borderColor: colors.border.primary },
  heroHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  goalTag:             { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius[2] },
  goalTagText:         { fontSize: fontSize[12], fontWeight: fontWeight.bold },
  heroChangedHint:     { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.tertiary },
  heroTargetRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroColLabel:        { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.tertiary, letterSpacing: 1.2, marginBottom: spacing[1] },
  heroTargetValueRow:  { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1] },
  heroKcalNew:         { fontSize: fontSize[32], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
  heroKcalUnit:        { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.tertiary },
  heroTargetChange:    { alignItems: 'flex-end', gap: spacing[1] },
  heroCompare:         { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary },
  heroDiffBadge:       { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius[2] },
  heroDiffText:        { fontSize: fontSize[14], fontWeight: fontWeight.extrabold },
  heroMacros:          { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[3], marginTop: spacing[3], marginBottom: spacing[3] },
  heroMacroItem:       { flex: 1, alignItems: 'center', gap: spacing[1] },
  heroMacroBorder:     { borderRightWidth: 1, borderRightColor: colors.border.default },
  heroMacroLabel:      { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.tertiary },
  heroMacroVal:        { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  heroMacroDiff:       { fontSize: fontSize[10], fontWeight: fontWeight.bold },
  heroFooter:          { borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[2] },
  heroRate:            { fontSize: fontSize[12], color: colors.text.secondary, textAlign: 'left', fontWeight: fontWeight.medium },
  sectionTitle:        { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: spacing[2], marginTop: spacing[3] },
  card:                { backgroundColor: colors.background.secondary, borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden', marginBottom: spacing[3] },
  divider:             { height: 1, backgroundColor: colors.border.default, marginHorizontal: spacing[4] },
  stepperRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  stepperLabel:        { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.primary },
  input:               { flex: 1, marginLeft: spacing[4], padding: 0, textAlign: 'right', fontSize: fontSize[16], fontWeight: fontWeight.medium, color: colors.text.primary },
  inputError:          { color: colors.accent.error },
  errorText:           { fontSize: fontSize[12], color: colors.accent.error, paddingHorizontal: spacing[4], paddingBottom: spacing[3], textAlign: 'right' },
  genderToggle:        { flexDirection: 'row', gap: spacing[2] },
  genderBtn:           { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius[3], backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
  genderBtnSelected:   { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
  genderBtnText:       { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.tertiary },
  genderBtnTextSelected: { color: colors.accent.buttonText, fontWeight: fontWeight.bold },
  optionDesc:          { fontSize: fontSize[12], color: colors.text.quaternary, fontWeight: fontWeight.medium, marginTop: spacing[1] },
  nutritionHint:       { fontSize: fontSize[12], color: colors.text.tertiary, lineHeight: fontSize[18], paddingHorizontal: spacing[4], paddingBottom: spacing[3] },
  automationTextCol:   { flex: 1, paddingRight: spacing[4] },
  logoutButton:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.faded.errorAlt, borderRadius: radius[4], height: spacing.buttonHeight, borderWidth: 1, borderColor: colors.border.error, marginTop: spacing[2] },
  logoutText:          { color: colors.accent.error, fontWeight: fontWeight.semibold, fontSize: fontSize[16] },
  deleteAccountButton: { alignItems: 'center', paddingVertical: spacing[4], marginTop: spacing[2] },
  deleteAccountText:   { color: colors.text.quaternary, fontWeight: fontWeight.medium, fontSize: fontSize[14] },
  footer:              { paddingHorizontal: spacing[4], paddingTop: spacing[3], backgroundColor: colors.background.primary },
  saveBtn:             { backgroundColor: colors.accent.primary, borderRadius: radius[4], paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled:     { backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.border.default },
  saveBtnText:         { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.accent.buttonText },
  saveBtnTextDisabled: { color: colors.text.quaternary },
}));

export default ProfileScreen;
