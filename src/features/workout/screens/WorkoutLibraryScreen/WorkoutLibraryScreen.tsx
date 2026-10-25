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
import type { WorkoutSplit } from '../../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { normalize } from '../../../../shared/hooks/useResponsive';
import styles from './WorkoutLibraryScreenStyle';
import { useWorkoutSplits } from '../../hooks/useWorkoutSplits';
import { deleteTemplateFromFirestore } from '../../services/workoutTemplateService';
import { workoutSplitQueryKey } from '../../services/workoutQueryKeys';
import { queryClient } from '../../../../shared/query/queryClient';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { getAuth } from 'firebase/auth';
import { deleteField } from 'firebase/firestore';
import { mergeUserProfile } from '../../../auth/services/userProfileQuery';
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
    const [activeSplitId, setActiveSplitId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const routeParams = (route.params ?? {}) as { initialSegment?: string };
    const [activeSegment, setActiveSegment] = useState<string>(routeParams.initialSegment || 'Templates');

    const { userData, refreshUserData } = useContext(AuthContext)!;
    const { activeWorkout } = useContext(WorkoutContext)!;
    const uid = getAuth().currentUser?.uid ?? null;
    const splitsQuery = useWorkoutSplits(uid);
    const templatesQuery = useWorkoutTemplates(uid);
    const splits = useMemo<WorkoutSplit[]>(() => (splitsQuery.data ?? []).map(split => {
        const fallback = typeof split.data === 'object' && split.data !== null
            ? split.data as WorkoutSplit
            : {};
        const normalized: WorkoutSplit = {
            ...split,
            schedule: split.schedule || fallback.schedule || {},
            durationWeeks: split.durationWeeks || fallback.durationWeeks || 8,
        };
        if (!normalized.id && fallback.id) normalized.id = fallback.id;
        if (!normalized.name && fallback.name) normalized.name = fallback.name;
        if (!normalized.templateName && fallback.templateName) normalized.templateName = fallback.templateName;
        if (!normalized.description && fallback.description) normalized.description = fallback.description;
        if (!normalized.type && fallback.type) normalized.type = fallback.type;
        return normalized;
    }), [splitsQuery.data]);
    const templates = templatesQuery.data ?? [];
    const loading = uid !== null && (splitsQuery.isLoading || templatesQuery.isLoading);
    const queryError = splitsQuery.error ?? templatesQuery.error;
    const alertedQueryError = useRef<unknown>(null);

    useEffect(() => {
        if (!queryError) {
            alertedQueryError.current = null;
            return;
        }
        if (alertedQueryError.current === queryError) return;
        alertedQueryError.current = queryError;
        Alert.alert('Error', 'Unable to fetch data.');
    }, [queryError]);

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

    useFocusEffect(
        useCallback(() => {
            if (splitsQuery.data !== undefined && splitsQuery.isStale) void splitsQuery.refetch();
            if (templatesQuery.data !== undefined && templatesQuery.isStale) void templatesQuery.refetch();
        }, [splitsQuery.data, splitsQuery.isStale, splitsQuery.refetch, templatesQuery.data, templatesQuery.isStale, templatesQuery.refetch])
    );

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([splitsQuery.refetch(), templatesQuery.refetch()]);
        } finally {
            setRefreshing(false);
        }
    }, [splitsQuery.refetch, templatesQuery.refetch]);

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
        } catch (error) {
            Alert.alert('Error', 'Failed to delete template.');
        }
    }, []);

    const handleSplitDeleted = useCallback(async (splitId: string, ownerUid: string) => {
        if (getAuth().currentUser?.uid !== ownerUid) return;

        const currentSplits = queryClient.getQueryData<WorkoutSplit[]>(workoutSplitQueryKey(ownerUid)) ?? splits;
        const remaining = currentSplits.filter(s => s.id !== splitId);

        const next = afterSplitDelete(splitId, remaining, activeSplitId, userData?.activeSplitId);
        setActiveSplitId(next.localActiveId);
        if (!next.clearPersisted) return;

        try {
            await mergeUserProfile(ownerUid, { activeSplitId: deleteField() }, true);
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
            await mergeUserProfile(uid!, update);

            setActiveSplitId(split.id);
            await refreshUserData();
            Alert.alert('Split Set as Active', `"${split.name || split.templateName}" is now active!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to activate split.');
        }
    }, [navigation, activeSplitId, refreshUserData]);

    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing || (splitsQuery.isFetching && splitsQuery.data !== undefined) || (templatesQuery.isFetching && templatesQuery.data !== undefined)}
            onRefresh={refreshData}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
        />
    ), [refreshing, refreshData, splitsQuery.isFetching, splitsQuery.data, templatesQuery.isFetching, templatesQuery.data]);

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
                            <Ionicons name="add" size={normalize(20)} color={colors.accent.primary} />
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
