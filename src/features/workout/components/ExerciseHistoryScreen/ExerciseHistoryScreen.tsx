import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
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
const TOOLTIP_WIDTH = 156;
const TOOLTIP_HEIGHT = 58;

const ProgressChart = ({ sessions, width }: ProgressChartProps & { width: number }) => {
    const chartW = width - PAD_SIDE * 2;
    const drawTop = PAD_TOP;
    const drawBot = CHART_H - PAD_BOTTOM;

    const chartModel = useMemo(
        () => buildExerciseHistoryChartModel(sessions, chartW, drawTop, drawBot),
        [sessions, chartW, drawTop, drawBot],
    );

    const [activeSelection, setActiveSelection] = useState<{ index: number; touchY: number } | null>(null);
    const points = chartModel?.points ?? [];
    const updateActivePoint = useCallback((touchX: number, touchY: number) => {
        if (!points.length) return;
        const localX = touchX - PAD_SIDE;
        let nearest = 0;
        let minDistance = Infinity;
        points.forEach((point, index) => {
            const distance = Math.abs(point.x - localX);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = index;
            }
        });
        setActiveSelection({ index: nearest, touchY });
    }, [points]);
    const pan = useMemo(() => Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-15, 15])
        .onBegin(event => runOnJS(updateActivePoint)(event.x, event.y))
        .onUpdate(event => runOnJS(updateActivePoint)(event.x, event.y))
        .onFinalize(() => runOnJS(setActiveSelection)(null)), [updateActivePoint]);
    const active = activeSelection ? points[activeSelection.index] : null;
    const bestSet = active && active.weight !== undefined && active.reps !== undefined
        ? formatBestSet({ weight: active.weight, reps: active.reps })
        : null;
    const tooltipLeft = active
        ? Math.min(
            Math.max(active.x + PAD_SIDE - TOOLTIP_WIDTH / 2, 0),
            Math.max(width - TOOLTIP_WIDTH, 0),
        )
        : 0;
    const tooltipTop = activeSelection
        ? Math.min(
            activeSelection.touchY > TOOLTIP_HEIGHT + 8
                ? activeSelection.touchY - TOOLTIP_HEIGHT - 8
                : activeSelection.touchY + 16,
            CHART_H - TOOLTIP_HEIGHT,
        )
        : 0;

    if (!chartModel) return null;

    return (
        <GestureDetector gesture={pan}>
            <View style={{ width }}>
                <Svg width={width} height={CHART_H}>
                    <G x={PAD_SIDE}>
                        <Path d={chartModel.areaPath} fill={colors.accent.primary} fillOpacity={0.07} />
                        <Path d={chartModel.linePath} stroke={colors.accent.primary} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                        {active && (
                            <>
                                <Line
                                    x1={active.x}
                                    y1={PAD_TOP}
                                    x2={active.x}
                                    y2={CHART_H - PAD_BOTTOM}
                                    stroke={colors.text.quaternary}
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />
                                <Circle
                                    cx={active.x}
                                    cy={active.y}
                                    r={5}
                                    fill={colors.accent.primary}
                                    stroke={colors.background.secondary}
                                    strokeWidth="2"
                                />
                            </>
                        )}
                        {chartModel.points.map((point, index) => (
                            <Circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r={activeSelection?.index === index ? 0 : 3}
                                fill={colors.accent.primary}
                            />
                        ))}
                        {chartModel.showLabels.map((point, index) => (
                            <SvgText key={index} x={point.x} y={CHART_H - 8} fontSize={9} fontWeight="500" fill={colors.text.quaternary} textAnchor={getExerciseHistoryLabelAnchor(point.i, point.total)}>
                                {point.label}
                            </SvgText>
                        ))}
                    </G>
                </Svg>
                {active && (
                    <View pointerEvents="none" style={[styles.chartTooltip, { left: tooltipLeft, top: tooltipTop, width: TOOLTIP_WIDTH }]}>
                        <Text style={styles.chartTooltipLabel}>{active.tooltipLabel}</Text>
                        {bestSet && <Text style={styles.chartTooltipBest}>{bestSet}</Text>}
                        <Text style={styles.chartTooltipValue}>{active.e1rm.toFixed(1)} kg estimated 1RM</Text>
                    </View>
                )}
            </View>
        </GestureDetector>
    );
};

const SessionItem = ({ session, isLast }: SessionItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const { label } = formatExerciseHistoryDate(session.timestamp);
    const totalSets = session.sets.length;

    return (
        <View style={[styles.sessionCard, isLast && styles.sessionCardLast]}>
            <TouchableOpacity
                style={styles.sessionRow}
                onPress={() => setExpanded(prev => !prev)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
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
                    <Text style={[
                        styles.sessionBestValue,
                        session.sets.some(set => set.isPR) && styles.sessionBestValuePR,
                    ]}>
                        {formatBestSet(session.best) || '-'}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={spacing.iconSm}
                        color={colors.text.quaternary}
                    />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedSets}>
                    <View style={styles.setHeaderRow}>
                        <Text style={styles.setHeaderIndex}>SET</Text>
                        <Text style={styles.setHeaderWeight}>WEIGHT</Text>
                        <Text style={styles.setHeaderReps}>REPS</Text>
                        <Text style={styles.setHeaderRM}>EST. 1RM</Text>
                    </View>
                    {session.sets.map((set, i) => {
                        const e1rm = calculate1RM(parseFloat(String(set.weight ?? 0)) || 0, parseInt(String(set.reps ?? 0), 10) || 0);
                        return (
                            <View key={i} style={[styles.setRow, i === session.sets.length - 1 && styles.setRowLast]}>
                                <Text style={styles.setIndex}>{i + 1}</Text>
                                <Text style={styles.setWeight}>{parseFloat(String(set.weight ?? 0))}kg</Text>
                                <Text style={styles.setReps}>{parseInt(String(set.reps ?? 0), 10)}</Text>
                                <View style={styles.setColRM}>
                                    <Text style={styles.setRM}>{e1rm.toFixed(1)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
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
    const { width: screenWidth } = useWindowDimensions();
    const chartWidth = screenWidth - spacing[4] * 4;

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
        <View style={styles.screenHeader}>
            <View style={styles.backRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={spacing.icon} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.heading} numberOfLines={1}>{exerciseName}</Text>
            </View>
        </View>
    );

    const listHeader = (
        <>
            <View style={styles.summaryCard}>
                {allTimeBest && (
                    <View style={styles.bestSummary}>
                        <View style={styles.bestMetric}>
                            <Text style={styles.bestEyebrow}>ALL-TIME BEST</Text>
                            <Text style={styles.bestValue}>{formatBestSet(allTimeBest) || '-'}</Text>
                        </View>
                        <View style={styles.oneRmCard}>
                            <Text style={styles.oneRmLabel}>EST. 1RM</Text>
                            <Text style={styles.oneRmValue}>{allTimeBest.e1rm.toFixed(1)} kg</Text>
                        </View>
                    </View>
                )}

                <View style={styles.progressHeading}>
                    <Text style={styles.progressTitle}>Progress</Text>
                    <Text style={styles.progressSubtitle}>Estimated 1RM per session</Text>
                </View>
                <View style={styles.periodRow}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p.key}
                            style={[styles.periodChip, selectedPeriod === p.key && styles.periodChipActive]}
                            onPress={() => setSelectedPeriod(p.key)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedPeriod === p.key }}
                            accessibilityLabel={p.key === 999 ? 'Show all sessions' : `Show last ${p.key} sessions`}
                        >
                            <Text style={[styles.periodChipText, selectedPeriod === p.key && styles.periodChipTextActive]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {filteredSessions.length >= 2 && (
                    <View style={styles.chartWrapper}>
                        <ProgressChart sessions={filteredSessions} width={chartWidth} />
                    </View>
                )}
            </View>
            <View style={styles.sessionsHeading}>
                <Text style={styles.sessionsTitle}>Sessions</Text>
                <Text style={styles.sessionsCount}>
                    {filteredSessions.length}{filteredSessions.length !== sessions.length ? ` of ${sessions.length}` : ''}
                </Text>
            </View>
        </>
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
            {historyHeader}
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
                    ListHeaderComponent={listHeader}
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