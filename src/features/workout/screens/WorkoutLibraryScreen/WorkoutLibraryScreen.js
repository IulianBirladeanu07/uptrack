import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  View,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';
import styles, { COLORS } from './WorkoutLibraryScreenStyle';
import { fetchSplitsFromFirestore, fetchTemplatesFromFirestore, deleteTemplateFromFirestore } from '../../handlers/WorkoutHandler';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../auth/services/firebaseConfigService';
import { AuthContext } from '../../../auth/context/AuthContext';
import WorkoutTemplateLibrary from './WorkoutTemplateLibrary';
import WorkoutProgramLibrary from './WorkoutProgramLibrary';
import SegmentedControl from './components/SegmentedControls';
import LoadingSpinner from './components/LoadingSpinner';

const WorkoutLibraryScreen = ({ navigation, route }) => {
  const [splits, setSplits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeSplitId, setActiveSplitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState(route.params?.initialSegment || 'Templates');

  const { refreshUserData } = useContext(AuthContext);

  useEffect(() => {
    if (route.params?.initialSegment) {
      setActiveSegment(route.params.initialSegment);
    }
  }, [route.params?.initialSegment]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [splitsData, templatesData] = await Promise.all([
        fetchSplitsFromFirestore(),
        fetchTemplatesFromFirestore(),
      ]);

      if (splitsData) {
        const normalizedSplits = splitsData.map(split => ({
          id: split.id || split.data?.id,
          name: split.name || split.data?.name,
          templateName: split.templateName || split.data?.templateName,
          description: split.description || split.data?.description,
          type: split.type || split.data?.type,
          schedule: split.schedule || split.data?.schedule || {},
          durationWeeks: split.durationWeeks || split.data?.durationWeeks || 8,
        }));
        setSplits(normalizedSplits);
        if (normalizedSplits.length > 0 && !activeSplitId) {
          setActiveSplitId(normalizedSplits[0].id);
        }
      }

      if (templatesData) {
        setTemplates(templatesData);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [activeSplitId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCreate = useCallback(() => {
    navigation.navigate(activeSegment === 'Splits' ? 'CreateSplit' : 'CreateWorkout', { templates });
  }, [navigation, activeSegment, templates]);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      await deleteTemplateFromFirestore(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete template.');
    }
  }, []);

  const handleActivateSplit = useCallback(async (split) => {
    if (activeSplitId === split.id) {
      navigation.navigate('SplitSchedule', { split });
      return;
    }

    try {
      const schedule = split.schedule || {};
      const targetWorkouts = Object.values(schedule)
        .filter(day => day.exercises?.length > 0).length;

      const uid = getAuth().currentUser?.uid;
      await setDoc(doc(db, 'users', uid), {
        activeSplitId: split.id,
        targetWorkoutsPerWeek: targetWorkouts || 5,
      }, { merge: true });

      setActiveSplitId(split.id);
      await refreshUserData();
      Alert.alert('Split Set as Active', `"${split.name || split.templateName}" is now active!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to activate split.');
    }
  }, [navigation, activeSplitId, refreshUserData]);

  const activeSplit = useMemo(() => splits.find((split) => split.id === activeSplitId) || null, [splits, activeSplitId]);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refreshData}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  ), [refreshing, refreshData]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchData();
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.surface} />
      <View style={styles.statusBarBackground} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Workout Library</Text>
            <TouchableOpacity
              style={styles.headerCreateButton}
              onPress={handleCreate}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={normalize(20)} color={COLORS.bg} />
              <Text style={styles.headerCreateButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <SegmentedControl
            activeSegment={activeSegment}
            onTemplatesPress={() => setActiveSegment('Templates')}
            onSplitsPress={() => setActiveSegment('Splits')}
          />
        </View>

        {loading ? (
          <LoadingSpinner type={activeSegment} />
        ) : activeSegment === 'Templates' ? (
          <WorkoutTemplateLibrary
            templates={templates}
            navigation={navigation}
            refreshControl={refreshControl}
            onCreateTemplate={handleCreate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        ) : (
          <WorkoutProgramLibrary
            splits={splits}
            activeSplitId={activeSplitId}
            navigation={navigation}
            refreshControl={refreshControl}
            onCreateSplit={handleCreate}
            onActivateSplit={handleActivateSplit}
          />
        )}
      </SafeAreaView>
    </>
  );
};

export default React.memo(WorkoutLibraryScreen);