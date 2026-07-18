import { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../auth/services/firebaseConfigService';
import { AuthContext } from '../../auth/context/AuthContext';
import { calculateWeightChangePlan, deriveFitnessGoal } from '../utils/nutritionPlanEngine';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../shared/theme';
import { createStyles } from '../../../shared/theme/createStyles';

const PlanSummaryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { setProfileSetupComplete, refreshUserData } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);

  const formData = route.params?.formData || {};

  const derivedGoal = deriveFitnessGoal(formData.currentWeight, formData.targetWeight);

  const plan = calculateWeightChangePlan({ ...formData, fitnessGoals: derivedGoal });
  const isGaining = derivedGoal === 'muscle_gain';

  const handleConfirm = async () => {
    setSaving(true);
    const user = getAuth().currentUser;

    if (!user) {
      Alert.alert('Error', 'No user is logged in.');
      setSaving(false);
      return;
    }

    const now = new Date().toISOString();

    const userData = {
      ...formData,
      fitnessGoals:          derivedGoal,
      profileSetupComplete:  true,
      weightChangePlan:      plan,
      targetCalories:        plan.goalCalories,
      targetProtein:         plan.macros.protein,
      targetCarbs:           plan.macros.carbs,
      targetFats:            plan.macros.fats,
      maintenanceCalories:   plan.tdee,
      targetsSource:         'formula',
      targetsInitializedAt:  now,
      weeksSinceCutStart:    0,
      startWeight:           formData.currentWeight,
      goalSwitchDate:        now,
      bfCategoryCollected:   !!formData.bfCategory,
      bfCategorySetAt:       formData.bfCategory ? now : null,
      bfCategoryWeightAtSet: formData.bfCategory ? formData.currentWeight : null,
      autoAdjustEnabled:     true,
      planConfidence:        'estimated',
    };

    try {
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    } catch (error) {
      console.error('PlanSummaryScreen save error:', error);
      Alert.alert('Error', 'Failed to save your plan. Please try again.');
      setSaving(false);
      return;
    }

    try {
      await refreshUserData();
    } catch (error) {
      console.error('PlanSummaryScreen refresh error:', error);
    }

    setProfileSetupComplete(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Your Plan</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={[styles.goalTag, { backgroundColor: isGaining ? colors.faded.success : colors.faded.primary }]}>
              <Text style={[styles.goalTagText, { color: isGaining ? colors.accent.success : colors.accent.primary }]}>
                {isGaining ? 'Muscle Gain' : derivedGoal === 'maintenance' ? 'Maintenance' : 'Cut'}
              </Text>
            </View>
            <View style={styles.estimateBadge}>
              <Text style={styles.estimateBadgeText}>Estimated</Text>
            </View>
          </View>

          <View style={styles.heroKcalCol}>
            <Text style={styles.heroKcal}>{plan.goalCalories}</Text>
            <Text style={styles.heroKcalUnit}>kcal / day</Text>
          </View>

          <View style={styles.heroMacros}>
            {[
              { label: 'Protein', value: plan.macros.protein, color: colors.accent.purple  },
              { label: 'Carbs',   value: plan.macros.carbs,   color: colors.accent.success },
              { label: 'Fat',     value: plan.macros.fats,    color: colors.accent.cyan    },
            ].map((m, i, arr) => (
              <View key={m.label} style={[styles.heroMacroItem, i < arr.length - 1 && styles.heroMacroBorder]}>
                <View style={[styles.heroMacroDot, { backgroundColor: m.color }]} />
                <Text style={styles.heroMacroLabel}>{m.label.toUpperCase()}</Text>
                <Text style={styles.heroMacroVal}>{m.value}g</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroRate}>
              {plan.ratePerWeek > 0
                ? `${isGaining ? '+' : '-'}${plan.ratePerWeek} kg/week - about ${plan.weeksToGoal} weeks to goal`
                : 'Calories set for weight maintenance'}
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.text.tertiary} />
          <Text style={styles.noteText}>
            These numbers are a starting estimate based on standard formulas. Once you log meals and weigh-ins consistently, your plan will refine itself automatically.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.accent.buttonText} />
            : <Text style={styles.confirmBtnText}>Confirm & Start</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  root:              { flex: 1, backgroundColor: colors.background.primary },
  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[3] },
  backBtn:           { width: spacing[10], height: spacing[10], borderRadius: radius[3], backgroundColor: colors.background.secondary, justifyContent: 'center', alignItems: 'center' },
  topBarTitle:       { fontSize: fontSize[22], fontWeight: fontWeight.bold, color: colors.text.primary, flex: 1 },
  topBarRight:       { width: spacing[10] },
  scroll:            { flex: 1 },
  scrollContent:     { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  hero:              { backgroundColor: colors.background.secondary, borderRadius: radius[4], padding: spacing[5], borderWidth: 1, borderColor: colors.border.default },
  heroHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5] },
  goalTag:           { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius[2] },
  goalTagText:       { fontSize: fontSize[12], fontWeight: fontWeight.bold },
  estimateBadge:     { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius[2], backgroundColor: colors.faded.surfaceMedium },
  estimateBadgeText: { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.tertiary },
  heroKcalCol:       { alignItems: 'center', marginBottom: spacing[5] },
  heroKcal:          { fontSize: fontSize[48], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -1 },
  heroKcalUnit:      { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: spacing[1] },
  heroMacros:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[4], marginBottom: spacing[4] },
  heroMacroItem:     { flex: 1, alignItems: 'center', gap: spacing[1] },
  heroMacroBorder:   { borderRightWidth: 1, borderRightColor: colors.border.default },
  heroMacroDot:      { width: spacing[2], height: spacing[2], borderRadius: radius[1] },
  heroMacroLabel:    { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.text.quaternary, letterSpacing: 1 },
  heroMacroVal:      { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  heroFooter:        { borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing[3] },
  heroRate:          { fontSize: fontSize[12], color: colors.text.secondary, textAlign: 'center', fontWeight: fontWeight.medium },
  noteCard:          { flexDirection: 'row', gap: spacing[2], backgroundColor: colors.background.secondary, borderRadius: radius[3], borderWidth: 1, borderColor: colors.border.default, padding: spacing[4] },
  noteText:          { flex: 1, fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.tertiary, lineHeight: fontSize[16] },
  footer:            { paddingHorizontal: spacing[4], paddingTop: spacing[3], backgroundColor: colors.background.primary },
  confirmBtn:        { backgroundColor: colors.accent.primary, borderRadius: radius[4], paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center' },
  confirmBtnText:    { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.accent.buttonText },
}));

export default PlanSummaryScreen;