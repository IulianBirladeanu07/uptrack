import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { getExerciseHistory, calculate1RM } from '../../handlers/WorkoutHandler';
import { colors, spacing } from '../../../../shared/theme';
import styles from './ExerciseHistoryScreenStyles';

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

const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return { label: 'Recent' };
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (date.toDateString() === today.toDateString()) return { label: 'Today' };
    if (date.toDateString() === yesterday.toDateString()) return { label: 'Yesterday' };
    return { label: `${monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` };
};

const labelAnchor = (i, total) =>
    i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle';

const ProgressChart = ({ sessions }) => {
    const chartW = SCREEN_WIDTH - spacing[4] * 2 - PAD_SIDE * 2;
    const drawTop = PAD_TOP;
    const drawBot = CHART_H - PAD_BOTTOM;

    const points = useMemo(() => {
        if (sessions.length < 2) return [];
        const reversed = [...sessions].reverse();
        const values = reversed.map(s => s.best.e1rm);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const pad = Math.max((max - min) * 0.3, 5);
        const yMin = min - pad;
        const yMax = max + pad;
        const n = reversed.length - 1;
        return reversed.map((s, i) => ({
            x: n === 0 ? chartW / 2 : (i / n) * chartW,
            y: drawTop + (1 - (s.best.e1rm - yMin) / (yMax - yMin || 1)) * (drawBot - drawTop),
            label: formatDate(s.timestamp).label.split(',')[0],
            i,
            total: reversed.length,
        }));
    }, [sessions, chartW, drawTop, drawBot]);

    if (points.length < 2) return null;

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${drawBot} L ${points[0].x.toFixed(1)} ${drawBot} Z`;

    const showLabels = points.length <= 6
        ? points
        : points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 4) === 0);

    return (
        <Svg width={chartW + PAD_SIDE * 2} height={CHART_H}>
            <G x={PAD_SIDE}>
                <Path d={areaPath} fill={colors.accent.primary} fillOpacity={0.07} />
                <Path d={linePath} stroke={colors.accent.primary} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.accent.primary} />)}
                {showLabels.map((p, i) => (
                    <SvgText key={i} x={p.x} y={CHART_H - 8} fontSize={9} fontWeight="500" fill={colors.text.quaternary} textAnchor={labelAnchor(p.i, p.total)}>
                        {p.label}
                    </SvgText>
                ))}
            </G>
        </Svg>
    );
};

const SessionItem = ({ session, isLast }) => {
    const [expanded, setExpanded] = useState(false);
    const { label } = formatDate(session.timestamp);
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
                        {parseFloat(session.best.weight)}kg × {parseInt(session.best.reps)}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={spacing.iconSm}
                        color={colors.text.quaternary}
                    />
                </View>
            </TouchableOpacity>

            {expanded && session.sets.map((set, i) => {
                const e1rm = calculate1RM(parseFloat(set.weight) || 0, parseInt(set.reps) || 0);
                return (
                    <View key={i} style={[styles.setRow, i === session.sets.length - 1 && styles.setRowLast]}>
                        <Text style={styles.setIndex}>{i + 1}</Text>
                        <Text style={styles.setWeight}>{parseFloat(set.weight)}kg</Text>
                        <Text style={styles.setReps}>{parseInt(set.reps)}</Text>
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

const ExerciseHistoryScreen = ({ route, navigation }) => {
    const { exerciseName } = route.params;
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(10);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getExerciseHistory(exerciseName);
            setSessions(data);
            setLoading(false);
        };
        load();
    }, [exerciseName]);

    const filteredSessions = useMemo(() => sessions.slice(0, selectedPeriod), [sessions, selectedPeriod]);

    const allTimeBest = useMemo(() => {
        if (!sessions.length) return null;
        return sessions.reduce((best, s) => s.best.e1rm > best.e1rm ? s.best : best, sessions[0].best);
    }, [sessions]);

    const renderItem = useCallback(({ item, index }) => (
        <SessionItem
            session={item}
            isLast={index === filteredSessions.length - 1}
        />
    ), [filteredSessions.length]);

    const keyExtractor = useCallback((item) => item.id, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                    <Text style={styles.loadingText}>Loading history...</Text>
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
                            {parseFloat(allTimeBest.weight)}kg × {parseInt(allTimeBest.reps)}
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