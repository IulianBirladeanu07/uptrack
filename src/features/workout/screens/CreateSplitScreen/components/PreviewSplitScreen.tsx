import { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppNavigation, useAppRoute } from '../../../../../shared/navigation';
import type { WorkoutSplit } from '../../../types';
import type { PreviewDayWorkout } from './previewSplitData';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { colors, spacing } from '../../../../../shared/theme';
import { db } from '../../../../auth/services/firebaseConfigService';
import { AuthContext } from '../../../../auth/context/AuthContext';
import { WorkoutContext } from '../../../context/WorkoutContext';
import { fetchSplitsFromFirestore } from '../../../services/workoutSplitService';
import styles from './PreviewSplitScreenStyle';
import { getPreviewSplitStats } from './previewSplitData';
import DaySelector from './DaySelector';
import MuscleCoverageCard from './MuscleCoverageCard';
import WorkoutExercisePreview, { ExercisePreviewList } from '../../../components/WorkoutExercisePreview/WorkoutExercisePreview';
import { getCycleLength, getWorkoutsPerWeek, hasScheduledWorkout, isRotationSplit, toDateKey, type SplitLike } from '../../../utils/splitSchedule';

const asSplit = (s: PreviewSplit | null | undefined): SplitLike => s as SplitLike;

type PreviewSplit = WorkoutSplit & {
  schedule?: Record<string, PreviewDayWorkout | null | undefined>;
  type?: string;
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const PreviewSplitScreen = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'PreviewSplit'>();
  const { splitData } = route.params || {};
  const [split, setSplit] = useState<PreviewSplit | null | undefined>(splitData as PreviewSplit | undefined);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(false);

  const { userData, refreshUserData } = useContext(AuthContext)!;
  const { activeWorkout } = useContext(WorkoutContext)!;
  const isActiveSplit = !!split?.id && userData?.activeSplitId === split.id;
  const insets = useSafeAreaInsets();

  const todayKey = useMemo(() => DAY_NAMES[new Date().getDay()], []);

  useEffect(() => {
    if (split && !selectedDay) {
      if (split.type === 'weekly') {
        setSelectedDay(todayKey);
      } else if (split.type === 'rotation') {
        const rotationDays = Object.keys(split.schedule || {}).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        if (rotationDays.length > 0) {
          setSelectedDay(rotationDays[0]);
        }
      }
    }
  }, [split, selectedDay, todayKey]);

  const scheduleDays = useMemo(() => {
    if (split?.type === 'weekly') {
      return [
        { id: 'monday', name: 'Monday', shortLabel: 'M' },
        { id: 'tuesday', name: 'Tuesday', shortLabel: 'T' },
        { id: 'wednesday', name: 'Wednesday', shortLabel: 'W' },
        { id: 'thursday', name: 'Thursday', shortLabel: 'T' },
        { id: 'friday', name: 'Friday', shortLabel: 'F' },
        { id: 'saturday', name: 'Saturday', shortLabel: 'S' },
        { id: 'sunday', name: 'Sunday', shortLabel: 'S' },
      ];
    } else if (split?.type === 'rotation') {
      const dayCount = getCycleLength(asSplit(split));
      return Array.from({ length: dayCount }, (_, i) => ({
        id: `${i + 1}`,
        name: `Day ${i + 1}`,
        shortLabel: `${i + 1}`,
      }));
    }
    return [];
  }, [split]);

  const selectedDayWorkout = useMemo((): PreviewDayWorkout | null => {
    if (!selectedDay) return null;
    const workout = split?.schedule?.[selectedDay] ?? null;
    return hasScheduledWorkout(workout) ? workout : null;
  }, [selectedDay, split]);

  const previewStats = useMemo(
    () => getPreviewSplitStats(split?.schedule || {}, selectedDayWorkout),
    [split?.schedule, selectedDayWorkout],
  );

  const isViewingToday = split?.type === 'weekly' && selectedDay === todayKey;
  const canStartFromHere = isActiveSplit && isViewingToday;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [splitsData] = await Promise.all([
        fetchSplitsFromFirestore(),
        refreshUserData(),
      ]);

      // Firestore split docs are loosely shaped
      const match = (splitsData as any[] | undefined)?.find(
        (s: any) => (s?.id || s?.data?.id) === split?.id,
      );
      if (match) {
        const data = match.data || {};
        setSplit({
          id: match.id || data.id,
          name: match.name || data.name,
          templateName: match.templateName || data.templateName,
          description: match.description || data.description,
          type: match.type || data.type,
          schedule: match.schedule || data.schedule || {},
          durationWeeks: match.durationWeeks || data.durationWeeks || 8,
        } as PreviewSplit);
      }
    } catch (error) {
      console.error('Error refreshing split:', error instanceof Error ? error.message : error);
    } finally {
      setRefreshing(false);
    }
  }, [split?.id, refreshUserData]);

  const editedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!editedRef.current) return;
      editedRef.current = false;
      handleRefresh();
    }, [handleRefresh])
  );

  const handleStartWorkout = useCallback((workout: PreviewDayWorkout | null | undefined) => {
    if (!workout || activeWorkout) return;
    navigation.navigate('StartWorkout', {
      selectedWorkout: workout,
    });
  }, [navigation, activeWorkout]);

  const handleEditSplit = useCallback(() => {
    if (!split) return;
    editedRef.current = true;
    navigation.navigate('CreateSplit', {
      split,
    });
  }, [navigation, split]);

  const handleActivateSplit = useCallback(async () => {
    if (!split || isActiveSplit || activating) return;

    setActivating(true);
    try {
      const update: {
        activeSplitId: string | undefined;
        targetWorkoutsPerWeek: number;
        rotationStartDate?: string;
      } = {
        activeSplitId: split.id,
        targetWorkoutsPerWeek: getWorkoutsPerWeek(asSplit(split)) || 5,
      };
      if (isRotationSplit(asSplit(split))) update.rotationStartDate = toDateKey(new Date());
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;

      await setDoc(doc(db, 'users', uid), update, { merge: true });

      await refreshUserData();
      Alert.alert('Split Activated', `"${split?.name ?? 'Split'}" is now your active split.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to activate split.');
    } finally {
      setActivating(false);
    }
  }, [split, isActiveSplit, activating, refreshUserData]);

  if (!split) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={spacing[16]} color={colors.text.quaternary} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Split data is missing</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.startButton}>
          <Text style={styles.startButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeLabel = split.type === 'weekly' ? 'Weekly Split' : split.type === 'rotation' ? 'Rotation Split' : 'Training Split';
  const cycleLabel = split.type === 'weekly' ? '7-day cycle' : `${scheduleDays.length}-day cycle`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
          />
        }
      >
        <View style={[styles.contentContainer, { paddingBottom: spacing[7] + insets.bottom }]}>
          <View style={[styles.heroCard, isActiveSplit && styles.heroCard]}>
            <View style={styles.heroTop}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={spacing.iconMd} color={colors.text.primary} />
              </TouchableOpacity>

              <View style={styles.titleSection}>
                <Text style={styles.splitType}>{typeLabel} · {cycleLabel}</Text>
                <Text style={styles.splitName} numberOfLines={1}>
                  {split?.name || 'Training Split'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleEditSplit}
                activeOpacity={0.7}
              >
                <Feather name="edit-3" size={spacing.iconMd} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.metaText}>{previewStats.compositionStats.workoutDays} workout days</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="layers-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.metaText}>{previewStats.compositionStats.totalSets} sets</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.metaText}>
                  {Math.round((previewStats.compositionStats.totalDuration / 60) * 10) / 10}h per cycle
                </Text>
              </View>
            </View>

            {isActiveSplit ? (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={spacing.iconMd} color={colors.accent.primary} />
                <Text style={styles.activeBadgeText}>This is your active split</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.activateButton}
                onPress={handleActivateSplit}
                activeOpacity={0.8}
                disabled={activating}
              >
                <Ionicons name="flash" size={spacing.iconMd} color={colors.accent.buttonText} />
                <Text style={styles.activateButtonText}>
                  {activating ? 'Activating…' : 'Set as Active Split'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <DaySelector
            days={scheduleDays.map(day => ({
              id: day.id,
              shortLabel: day.shortLabel,
              name: day.name,
              hasWorkout: hasScheduledWorkout(split?.schedule?.[day.id]),
              isToday: day.id === todayKey,
            }))}
            selectedDayId={selectedDay}
            onSelectDay={setSelectedDay}
            layout={split?.type === 'weekly' ? 'row' : 'scroll'}
            showLabels={split?.type === 'weekly'}
          />

          {selectedDayWorkout ? (
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTitle}>{selectedDayWorkout.templateName || 'Workout'}</Text>
                <View style={styles.workoutMetaRow}>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="time-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                    <Text style={styles.workoutMetaText}>{previewStats.selectedDayStats?.duration}m</Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="barbell-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                    <Text style={styles.workoutMetaText}>{previewStats.selectedDayStats?.exerciseCount} exercises</Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="layers-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                    <Text style={styles.workoutMetaText}>{previewStats.selectedDayStats?.totalSets} sets</Text>
                  </View>
                </View>
              </View>

              {canStartFromHere ? (
                <WorkoutExercisePreview
                  exercises={selectedDayWorkout.exercises || []}
                  activeWorkout={!!activeWorkout}
                  onStart={() => handleStartWorkout(selectedDayWorkout)}
                />
              ) : (
                <ExercisePreviewList exercises={selectedDayWorkout.exercises || []} />
              )}
            </View>
          ) : (
            <View style={styles.restDayCard}>
              <Ionicons name="moon" size={spacing[8]} color={colors.text.quaternary} style={styles.restDayIcon} />
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDayDescription}>Time to recover and let your muscles repair</Text>
            </View>
          )}

          <MuscleCoverageCard
            muscleGroupSets={previewStats.muscleGroupSets}
            uncoveredMuscles={previewStats.uncoveredMuscles}
            subtitle="sets per muscle group this split"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PreviewSplitScreen;