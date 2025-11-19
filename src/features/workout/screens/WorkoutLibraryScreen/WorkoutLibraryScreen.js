import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';
import styles, { COLORS } from './WorkoutLibraryScreenStyle';
import { fetchSplitsFromFirestore, fetchTemplatesFromFirestore } from '../../handlers/WorkoutHandler';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import WorkoutTemplateLibrary from './WorkoutTemplateLibrary';
import WorkoutProgramLibrary from './WorkoutProgramLibrary';
import HeaderStats from './components/HeaderStats';
import SegmentedControl from './components/SegmentedControls';
import LoadingSpinner from './components/LoadingSpinner';

const MOCK_STATS = {
  totalTemplates: 5,
  workoutsLogged: 12,
  totalTime: '5h 30m',
};

const WorkoutLibraryScreen = ({ navigation }) => {
  const [splits, setSplits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeSplitId, setActiveSplitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState('Templates');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [splitsData, templatesData] = await Promise.all([
        fetchSplitsFromFirestore(),
        fetchTemplatesFromFirestore(),
      ]);

      if (!splitsData || !Array.isArray(splitsData)) {
        console.warn('fetchSplitsFromFirestore returned invalid data:', splitsData);
        setSplits([]);
      } else {
        const normalizedSplits = splitsData.map(split => ({
          id: split.id || split.data?.id,
          name: split.name || split.data?.name,
          templateName: split.templateName || split.data?.templateName,
          schedule: split.schedule || split.data?.schedule || {},
          durationWeeks: split.durationWeeks || split.data?.durationWeeks || 8,
        }));
        setSplits(normalizedSplits);
        if (normalizedSplits.length > 0 && !activeSplitId) {
          setActiveSplitId(normalizedSplits[0].id);
        }
      }

      if (!templatesData || !Array.isArray(templatesData)) {
        console.warn('fetchTemplatesFromFirestore returned invalid data:', templatesData);
        setTemplates([]);
      } else {
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Unable to fetch data. Please try again.');
      setSplits([]);
      setTemplates([]);
      setActiveSplitId(null);
    } finally {
      setLoading(false);
    }
  }, [activeSplitId]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const handleCreate = useCallback(() => {
    navigation.navigate(activeSegment === 'Splits' ? 'CreateSplit' : 'CreateWorkout', { templates });
  }, [navigation, activeSegment, templates]);

  const handleActivateSplit = useCallback((split) => {
    if (activeSplitId === split.id) {
      navigation.navigate('SplitSchedule', { split });
    } else {
      setActiveSplitId(split.id);
      setSplits((prevSplits) => {
        const newSplits = [...prevSplits.filter(s => s.id !== split.id), split];
        return newSplits;
      });
      Alert.alert('Split Set as Active', `"${split.name || split.templateName}" is now your active training program!`, [
        { text: 'OK' },
        { text: 'View Schedule', onPress: () => navigation.navigate('SplitSchedule', { split }) },
      ]);
    }
  }, [navigation, activeSplitId]);

  const handleTemplatesPress = useCallback(() => {
    setActiveSegment('Templates');
  }, []);

  const handleSplitsPress = useCallback(() => {
    setActiveSegment('Splits');
  }, []);

  const activeSplit = useMemo(() => splits.find((split) => split.id === activeSplitId) || null, [splits, activeSplitId]);

  const weekProgress = useMemo(() => {
    return activeSplit ? Math.floor(Math.random() * 100) : 0;
  }, [activeSplit]);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refreshData}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
      title="Refreshing..."
    />
  ), [refreshing, refreshData]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        setLoading(false);
        setSplits([]);
        setTemplates([]);
        setActiveSplitId(null);
      }
    });

    return () => unsubscribe();
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <HeaderStats
        activeSegment={activeSegment}
        totalItems={activeSegment === 'Splits' ? splits.length : MOCK_STATS.totalTemplates + templates.length}
        activeSplit={activeSplit}
        weekProgress={weekProgress}
        workoutsLogged={MOCK_STATS.workoutsLogged}
        totalTime={MOCK_STATS.totalTime}
      />

      <SegmentedControl
        activeSegment={activeSegment}
        onTemplatesPress={handleTemplatesPress}
        onSplitsPress={handleSplitsPress}
      />

      {loading ? (
        <LoadingSpinner type={activeSegment} />
      ) : activeSegment === 'Templates' ? (
        <WorkoutTemplateLibrary
          templates={templates}
          navigation={navigation}
          refreshControl={refreshControl}
          onCreateTemplate={handleCreate}
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

      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <MaterialIcons name="add" size={normalize(24)} color={COLORS.secondary} />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(WorkoutLibraryScreen);