import { useState, useEffect, useCallback, useMemo, useContext, useRef, memo } from 'react';
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
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import type { WorkoutSplit, WorkoutTemplate } from '../../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { normalize } from '../../../../shared/hooks/useResponsive';
import styles from './WorkoutLibraryScreenStyle';
import { fetchSplitsFromFirestore } from '../../services/workoutSplitService';
import { deleteTemplateFromFirestore, fetchTemplatesFromFirestore } from '../../services/workoutTemplateService';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../auth/services/firebaseConfigService';
import { colors } from '../../../../shared/theme';
import { AuthContext } from '../../../auth/context/AuthContext';
import { WorkoutContext } from '../../context/WorkoutContext';
import WorkoutTemplateLibrary from './WorkoutTemplateLibrary';
import WorkoutProgramLibrary from './WorkoutProgramLibrary';
import SegmentedControl from './components/SegmentedControls';
import LoadingSpinner from './components/LoadingSpinner';
import { getWorkoutsPerWeek, isRotationSplit, toDateKey } from '../../utils/splitSchedule';
import { afterSplitDelete } from '../../utils/activeSplit';

const WorkoutLibraryScreen = () => {
    const navigation = useAppNavigation();
    const route = useAppRoute<'WorkoutLibrary'>();
    const [splits, setSplits] = useState<WorkoutSplit[]>([]);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [activeSplitId, setActiveSplitId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const routeParams = (route.params ?? {}) as { initialSegment?: string };
    const [activeSegment, setActiveSegment] = useState<string>(routeParams.initialSegment || 'Templates');

    const { userData, refreshUserData } = useContext(AuthContext)!;
    const { activeWorkout } = useContext(WorkoutContext)!;
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (routeParams.initialSegment) {
            setActiveSegment(routeParams.initialSegment);
        }
    }, [routeParams.initialSegment]);

    useEffect(() => {
        if (userData?.activeSplitId) {
            setActiveSplitId(userData.activeSplitId);
        }
    }, [userData?.activeSplitId]);

    const fetchData = useCallback(async () => {
        if (!hasFetchedRef.current) setLoading(true);
        try {
            const [splitsData, templatesData] = await Promise.all([
                fetchSplitsFromFirestore(),
                fetchTemplatesFromFirestore(),
            ]);

            if (splitsData) {
                const normalizedSplits = (splitsData as any[]).map((split: any) => ({
                    id: split.id || split.data?.id,
                    name: split.name || split.data?.name,
                    templateName: split.templateName || split.data?.templateName,
                    description: split.description || split.data?.description,
                    type: split.type || split.data?.type,
                    schedule: split.schedule || split.data?.schedule || {},
                    durationWeeks: split.durationWeeks || split.data?.durationWeeks || 8,
                })) as WorkoutSplit[];
                setSplits(normalizedSplits);
                setActiveSplitId(prev => prev ?? userData?.activeSplitId ?? normalizedSplits[0]?.id ?? null);
            }

            if (templatesData) {
                setTemplates(templatesData as WorkoutTemplate[]);
            }

            hasFetchedRef.current = true;
        } catch (error) {
            Alert.alert('Error', 'Unable to fetch data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        hasFetchedRef.current = false;
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleCreate = useCallback(() => {
        if (activeSegment === 'Splits') {
            navigation.navigate('CreateSplit');
        } else {
            navigation.navigate('CreateTemplate');
        }
    }, [navigation, activeSegment]);

    const handleDeleteTemplate = useCallback(async (templateId: string) => {
        try {
            await deleteTemplateFromFirestore(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete template.');
        }
    }, []);

    const handleSplitDeleted = useCallback(async (splitId: string, ownerUid: string) => {
        if (getAuth().currentUser?.uid !== ownerUid) return;

        const remaining = splits.filter(s => s.id !== splitId);
        setSplits(remaining);

        const next = afterSplitDelete(splitId, remaining, activeSplitId, userData?.activeSplitId);
        setActiveSplitId(next.localActiveId);
        if (!next.clearPersisted) return;

        try {
            await setDoc(doc(db, 'users', ownerUid), { activeSplitId: deleteField() }, { merge: true });
            if (getAuth().currentUser?.uid !== ownerUid) return;
            await refreshUserData();
        } catch (error) {
            console.error('Failed to clear the active split:', error);
        }
    }, [splits, activeSplitId, userData?.activeSplitId, refreshUserData]);

    const handleActivateSplit = useCallback(async (split: WorkoutSplit) => {
        if (!split.id) {
            Alert.alert('Error', 'Unable to activate a split without an ID.');
            return;
        }
        if (activeSplitId === split.id) {
            navigation.navigate('PreviewSplit', { splitData: split });
            return;
        }

        try {
            const update: Record<string, unknown> = {
            activeSplitId: split.id,
                targetWorkoutsPerWeek: getWorkoutsPerWeek(split as any) || 5,
            };
            if (isRotationSplit(split as any)) update['rotationStartDate'] = toDateKey(new Date());

            const uid = getAuth().currentUser?.uid;
            await setDoc(doc(db, 'users', uid!), update, { merge: true });

            setActiveSplitId(split.id);
            await refreshUserData();
            Alert.alert('Split Set as Active', `"${split.name || split.templateName}" is now active!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to activate split.');
        }
    }, [navigation, activeSplitId, refreshUserData]);

    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
        />
    ), [refreshing, refreshData]);

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.secondary} />
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
                            <Ionicons name="add" size={normalize(20)} color={colors.text.tertiary} />
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
                        hasActiveWorkout={!!activeWorkout}
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
                        onSplitDeleted={handleSplitDeleted}
                    />
                )}
            </SafeAreaView>
        </>
    );
};

export default memo(WorkoutLibraryScreen);