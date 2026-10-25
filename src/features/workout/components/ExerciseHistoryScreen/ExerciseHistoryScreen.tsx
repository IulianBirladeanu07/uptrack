import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { getExerciseHistory } from '../../services/exerciseHistoryService';
import { calculate1RM, formatBestSet } from '../../utils/workoutMetrics';
import { colors, spacing } from '../../../../shared/theme';
import styles from './ExerciseHistoryScreenStyles';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import {
    formatExerciseHistoryDate,
    getExerciseHistoryLabelAnchor,
    type ExerciseHistoryTimestamp,
} from './exerciseHistoryPresentation';
import { buildExerciseHistoryChartModel } from './exerciseHistoryChart';

type TimestampLike = ExerciseHistoryTimestamp;

type HistorySet = {
    weight?: number | string;
    reps?: number | string;
    isPR?: boolean;
};

type HistoryBest = {
    weight: number | string;
    reps: number | string;
    e1rm: number;
};

type HistorySession = {
    id: string;
    timestamp?: TimestampLike;
    workoutName?: string;
    sets: HistorySet[];
    best: HistoryBest;
};

type ProgressChartProps = { sessions: HistorySession[] };
type SessionItemProps = { session: HistorySession; isLast: boolean };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERIODS = [
    { key: 5,   label: '5' },
    { key: 10,  label: '10' },
    { key: 20,  label: '20' },
    { key: 50,  label: '50' },
    { key: 999, label: 'All' },
];

const CHART_H    = 100;
const PAD_TOP    = 8;
const PAD_BOTTOM = 28;
const PAD_SIDE   = 8;

const ProgressChart = ({ sessions }: ProgressChartProps) => {
    const chartW = SCREEN_WIDTH - spacing[4] * 2 - PAD_SIDE * 2;
    const drawTop = PAD_TOP;
    const drawBot = CHART_H - PAD_BOTTOM;

    const chartModel = useMemo(
        () => buildExerciseHistoryChartModel(sessions, chartW, drawTop, drawBot),
        [sessions, chartW, drawTop, drawBot],
    );

    if (!chartModel) return null;

    return (
        <Svg width={chartW + PAD_SIDE * 2} height={CHART_H}>
            <G x={PAD_SIDE}>
                <Path d={chartModel.areaPath} fill={colors.accent.primary} fillOpacity={0.07} />
                <Path d={chartModel.linePath} stroke={colors.accent.primary} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                {chartModel.points.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.accent.primary} />)}
                {chartModel.showLabels.map((p, i) => (
                    <SvgText key={i} x={p.x} y={CHART_H - 8} fontSize={9} fontWeight="500" fill={colors.text.quaternary} textAnchor={getExerciseHistoryLabelAnchor(p.i, p.total)}>
                        {p.label}
                    </SvgText>
                ))}
            </G>
        </Svg>
    );
};

const SessionItem = ({ session, isLast }: SessionItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const { label } = formatExerciseHistoryDate(session.timestamp);
    const totalSets = session.sets.length;

    return (
        <View>
            <TouchableOpacity
                style={styles.sessionRow}
                onPress={() => setExpanded(prev => !prev)}
                activeOpacity={0.7}
            >
                <View style={styles.sessionLeft}>
                    <Text style={styles.sessionDate}>{label}</Text>
                    <View style={styles.sessionMeta}>
                        <View style={styles.sessionMetaItem}>
                            <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                            <Text style={styles.sessionMetaText}>{totalSets} sets</Text>
                        </View>
                        {session.workoutName && session.workoutName !== 'Workout' && (
                            <Text style={styles.sessionMetaText}>{session.workoutName}</Text>
                        )}
                    </View>
                </View>
                <View style={styles.sessionRight}>
                    <Text style={styles.sessionBestValue}>
                        {formatBestSet(session.best) || '-'}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={spacing.iconSm}
                        color={colors.text.quaternary}
                    />
                </View>
            </TouchableOpacity>

            {expanded && session.sets.map((set, i) => {
                const e1rm = calculate1RM(parseFloat(String(set.weight ?? 0)) || 0, parseInt(String(set.reps ?? 0), 10) || 0);
                return (
                    <View key={i} style={[styles.setRow, i === session.sets.length - 1 && styles.setRowLast]}>
                        <Text style={styles.setIndex}>{i + 1}</Text>
                        <Text style={styles.setWeight}>{parseFloat(String(set.weight ?? 0))}kg</Text>
                        <Text style={styles.setReps}>{parseInt(String(set.reps ?? 0), 10)}</Text>
                        <View style={[styles.setColRM, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}>
                            <Text style={styles.setRM}>{e1rm.toFixed(1)}</Text>
                            {set.isPR && <Text style={styles.prTag}>PR</Text>}
                        </View>
                    </View>
                );
            })}

            {!isLast && <View style={styles.sessionSeparator} />}
        </View>
    );
};

const ExerciseHistoryScreen = () => {
    const navigation = useAppNavigation();
    const route = useAppRoute<'ExerciseHistory'>();
    const { exerciseName, muscleGroup } = route.params;
    const [sessions, setSessions] = useState<HistorySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(10);
    const loadGeneration = useRef(0);

    const load = useCallback(async () => {
        const requestGeneration = ++loadGeneration.current;
        setLoading(true);
        setHasLoadError(false);
        try {
            const data = await getExerciseHistory(exerciseName, muscleGroup);
            if (requestGeneration !== loadGeneration.current) return;
            setSessions(data as HistorySession[]);
        } catch {
            if (requestGeneration === loadGeneration.current) setHasLoadError(true);
        } finally {
            if (requestGeneration === loadGeneration.current) setLoading(false);
        }
    }, [exerciseName, muscleGroup]);

    useEffect(() => {
        void load();
        return () => {
            loadGeneration.current++;
        };
    }, [load]);

    const filteredSessions = useMemo(() => sessions.slice(0, selectedPeriod), [sessions, selectedPeriod]);

    const allTimeBest = useMemo(() => {
        if (!sessions.length) return null;
        return sessions.reduce((best, s) => s.best.e1rm > best.e1rm ? s.best : best, sessions[0].best);
    }, [sessions]);

    const renderItem = useCallback(({ item, index }: { item: HistorySession; index: number }) => (
        <SessionItem
            session={item}
            isLast={index === filteredSessions.length - 1}
        />
    ), [filteredSessions.length]);

    const keyExtractor = useCallback((item: HistorySession) => item.id, []);

    const historyHeader = (
        <View style={styles.headerSection}>
            <View style={styles.backRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={spacing.icon} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.heading} numberOfLines={1}>{exerciseName}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {historyHeader}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                    <Text style={styles.loadingText}>Loading history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (hasLoadError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {historyHeader}
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="cloud-offline-outline" size={48} color={colors.accent.errorAlt} />
                    </View>
                    <Text style={styles.emptyTitle}>Could not load history</Text>
                    <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerSection}>
                <View style={styles.backRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={spacing.icon} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.heading} numberOfLines={1}>{exerciseName}</Text>
                </View>

                {allTimeBest && (
                    <View style={styles.bestRow}>
                        <Text style={styles.bestValue}>
                            {formatBestSet(allTimeBest) || '-'}
                        </Text>
                        <Text style={styles.bestLabel}>all-time best · {allTimeBest.e1rm.toFixed(1)} 1RM</Text>
                    </View>
                )}

                <View style={styles.periodRow}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p.key}
                            style={[styles.periodChip, selectedPeriod === p.key && styles.periodChipActive]}
                            onPress={() => setSelectedPeriod(p.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.periodChipText, selectedPeriod === p.key && styles.periodChipTextActive]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {filteredSessions.length >= 2 && (
                    <View style={styles.chartWrapper}>
                        <ProgressChart sessions={filteredSessions} />
                    </View>
                )}

                <View style={styles.divider} />
            </View>

            {sessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="barbell-outline" size={48} color={colors.text.quaternary} />
                    </View>
                    <Text style={styles.emptyTitle}>No history yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete a workout with {exerciseName} to start tracking progress.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSessions}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}
        </SafeAreaView>
    );
};

export default ExerciseHistoryScreen;