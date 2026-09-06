import React, { useMemo, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, spacing, fontSize, fontWeight } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { computeEmaSeries } from '../../../profile/utils/weightTrendEngine';

export const PERIODS = [
    { key: '7',     label: 'Week'  },
    { key: 'PHASE', label: 'Phase' },
    { key: '6M',    label: '6M'    },
    { key: 'ALL',   label: 'All'   },
];

const CHART_H       = 160;
const PAD_SIDE      = 10;
const PAD_TOP       = 10;
const PAD_BOTTOM    = 40;
const TOOLTIP_WIDTH = 76;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEK_MS    = 7 * 24 * 60 * 60 * 1000;
const MAX_POINTS = 20;

const PERIOD_SPAN_WEEKS = {
    '6M': 26,
};

const getEarliestDate = (data) =>
    data.reduce((min, e) => {
        const d = new Date(e.date);
        return d < min ? d : min;
    }, new Date());

const getDataWeeks = (data) =>
    Math.max(1, Math.ceil((Date.now() - getEarliestDate(data).getTime()) / WEEK_MS));

const getPhaseSpanWeeks = (goalSwitchDate) => {
    if (!goalSwitchDate) return null;
    const switchDate = new Date(goalSwitchDate);
    if (isNaN(switchDate.getTime())) return null;
    const diffMs = Date.now() - switchDate.getTime();
    if (diffMs <= 0) return null;
    return Math.max(1, Math.ceil(diffMs / WEEK_MS));
};

export const getAvailablePeriods = (data, goalSwitchDate) => {
    const phaseWeeks = getPhaseSpanWeeks(goalSwitchDate);
    const showPhase  = phaseWeeks != null && phaseWeeks >= 2;
    const base       = PERIODS.filter(p => p.key !== 'PHASE' || showPhase);

    if (!data?.length) return base.filter(p => p.key === '7' || p.key === 'PHASE' || p.key === 'ALL');

    const dataWeeks = getDataWeeks(data);

    return base.filter(p => {
        if (p.key === 'PHASE') return true;
        const span = PERIOD_SPAN_WEEKS[p.key];
        return span == null || dataWeeks >= span / 2;
    });
};

const toDateKey = (d) => d.toISOString().split('T')[0];

const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
    }
    return days;
};

const getMonday = (weekOffset = 0) => {
    const now  = new Date();
    const day  = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const d    = new Date(now);
    d.setDate(now.getDate() + diff + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
};

const buildLinePath = (pts) => {
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
};

const buildAreaPath = (linePath, pts, drawBot) => {
    if (!linePath || pts.length < 2) return '';
    return `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${drawBot} L ${pts[0].x.toFixed(1)} ${drawBot} Z`;
};

const getYScale = (weights) => {
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const pad = Math.max((max - min) * 0.4, 0.8);
    return { yMin: min - pad, yMax: max + pad };
};

const toY = (w, yMin, yMax, top, bottom) =>
    top + (1 - (w - yMin) / (yMax - yMin || 1)) * (bottom - top);

const labelAnchor = (i, total) =>
    i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle';

const getLabelAbove = (pts, i) => {
    const p    = pts[i];
    const prev = pts[i - 1];
    const next = pts[i + 1];

    if (prev && next) {
        if (p.y <= prev.y && p.y <= next.y) return true;
        if (p.y >= prev.y && p.y >= next.y) return false;
        return p.y < (prev.y + next.y) / 2;
    }
    if (next) return p.y <= next.y;
    if (prev) return p.y <= prev.y;
    return true;
};

const PHASE_WEEKLY_CAP = { cut: 24, bulk: 12 };

const resolveGranularity = (spanWeeks, weeklyCap = MAX_POINTS) => {
    if (spanWeeks <= weeklyCap) return { unit: 'week', count: spanWeeks };
    const months = Math.ceil(spanWeeks / 4.345);
    if (months <= MAX_POINTS) return { unit: 'month', count: months };
    return { unit: 'quarter', count: Math.ceil(spanWeeks / 13) };
};

const getSpanWeeks = (period, data, goalSwitchDate) => {
    const dataWeeks = getDataWeeks(data);

    if (period === 'PHASE') {
        const phaseWeeks = getPhaseSpanWeeks(goalSwitchDate) ?? dataWeeks;
        return Math.min(phaseWeeks, dataWeeks);
    }

    const maxWeeks = PERIOD_SPAN_WEEKS[period] ?? Infinity;
    return Math.min(maxWeeks, dataWeeks);
};

const getBucketRange = (unit, offset) => {
    if (unit === 'week') {
        const start = getMonday(-offset);
        const end   = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    const now = new Date();
    if (unit === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const end   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }
    const currentQuarterStart = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), currentQuarterStart - offset * 3, 1);
    const end   = new Date(now.getFullYear(), currentQuarterStart - offset * 3 + 3, 0, 23, 59, 59, 999);
    return { start, end };
};

const formatBucketLabel = (unit, start) => {
    if (unit === 'week')  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (unit === 'month') return start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `Q${q} '${String(start.getFullYear()).slice(2)}`;
};

const pickEvenLabels = (labels, max) => {
    if (labels.length <= max) return labels;
    const step   = (labels.length - 1) / (max - 1);
    const idxSet = new Set();
    for (let i = 0; i < max; i++) idxSet.add(Math.round(i * step));
    return labels.filter((_, i) => idxSet.has(i));
};

const formatExactDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const WeightChart = ({ data, period, isBulking, width, onDeltaChange, goalSwitchDate, startWeight }) => {
    const drawW   = width - PAD_SIDE * 2;
    const drawTop = PAD_TOP;
    const drawBot = CHART_H - PAD_BOTTOM;

    const { points, xLabels } = useMemo(() => {
        if (!data?.length) return { points: [], xLabels: [] };

        if (period === '7') {
            const days   = getLast7Days();
            const byDate = {};
            data.forEach(e => {
                const key = typeof e.date === 'string' ? e.date.split('T')[0] : toDateKey(new Date(e.date));
                if (e.weight > 0) byDate[key] = e.weight;
            });

            const slots = days.map((d, i) => ({
                key:    toDateKey(d),
                i,
                label:  DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
                weight: byDate[toDateKey(d)] ?? null,
            }));

            const present = slots.filter(s => s.weight != null);
            if (!present.length) return { points: [], xLabels: [] };

            const { yMin, yMax } = getYScale(present.map(s => s.weight));
            const n = slots.length - 1;

            const pts = present.map((s, idx) => ({
                x:      (s.i / n) * drawW,
                y:      toY(s.weight, yMin, yMax, drawTop, drawBot),
                key:    s.key,
                weight: s.weight,
                label:  s.label,
                idx,
                total:  present.length,
            }));
            pts.forEach((p, i) => { p.above = getLabelAbove(pts, i); });

            const labels = slots.map((s, i) => ({
                x: (s.i / n) * drawW, label: s.label, key: s.key, index: i, total: slots.length,
            }));

            return { points: pts, xLabels: labels };
        }

        const spanWeeks       = getSpanWeeks(period, data, goalSwitchDate);
        const weeklyCap       = period === 'PHASE' ? (isBulking ? PHASE_WEEKLY_CAP.bulk : PHASE_WEEKLY_CAP.cut) : MAX_POINTS;
        const { unit, count } = resolveGranularity(spanWeeks, weeklyCap);
        const allSlots        = [];

        const anchor = period === 'PHASE' && goalSwitchDate ? new Date(goalSwitchDate) : null;
        const hasAnchor = anchor && !isNaN(anchor.getTime()) && startWeight != null;

        if (hasAnchor) {
            const bucketMs = unit === 'week' ? WEEK_MS : unit === 'month' ? WEEK_MS * 4.345 : WEEK_MS * 13;

            allSlots.push({
                avg:   startWeight,
                slot:  0,
                label: formatExactDate(goalSwitchDate),
                key:   toDateKey(anchor),
            });

            for (let i = 0; i < count; i++) {
                const start = new Date(anchor.getTime() + i * bucketMs);
                if (start.getTime() > Date.now()) break;
                const end = new Date(Math.min(anchor.getTime() + (i + 1) * bucketMs - 1, Date.now()));

                const entries = data.filter(e => {
                    if (!e.weight || e.weight <= 0) return false;
                    const d = new Date(e.date);
                    return d >= start && d <= end;
                });

                const avg = entries.length
                    ? entries.reduce((s, e) => s + e.weight, 0) / entries.length
                    : null;

                allSlots.push({
                    avg,
                    slot:  i + 1,
                    label: formatBucketLabel(unit, end),
                    key:   toDateKey(end),
                });
            }
        } else {
            for (let i = count - 1; i >= 0; i--) {
                const { start, end } = getBucketRange(unit, i);

                const entries = data.filter(e => {
                    if (!e.weight || e.weight <= 0) return false;
                    const d = new Date(e.date);
                    return d >= start && d <= end;
                });

                const avg = entries.length
                    ? entries.reduce((s, e) => s + e.weight, 0) / entries.length
                    : null;

                allSlots.push({
                    avg,
                    slot:  count - 1 - i,
                    label: formatBucketLabel(unit, start),
                    key:   toDateKey(start),
                });
            }
        }

        const present = allSlots.filter(s => s.avg != null);
        if (!present.length) return { points: [], xLabels: [] };

        const { yMin, yMax } = getYScale(present.map(s => s.avg));
        const n = Math.max(allSlots.length - 1, 1);

        const pts = present.map((s, idx) => ({
            x:      (s.slot / n) * drawW,
            y:      toY(s.avg, yMin, yMax, drawTop, drawBot),
            key:    s.key,
            weight: s.avg,
            label:  s.label,
            idx,
            total:  present.length,
        }));
        pts.forEach((p, i) => { p.above = getLabelAbove(pts, i); });

        const labels = allSlots.map((s, i) => ({
            x: (s.slot / n) * drawW, label: s.label, key: s.key, index: i, total: allSlots.length,
        }));

        return { points: pts, xLabels: labels };
    }, [data, period, drawW, drawTop, drawBot, goalSwitchDate, isBulking, startWeight]);

    const linePath = useMemo(() => buildLinePath(points), [points]);
    const areaPath = useMemo(() => buildAreaPath(linePath, points, drawBot), [linePath, points, drawBot]);
    const visibleLabels = period === '7' ? xLabels : pickEvenLabels(xLabels, 6);

    const labeledIndices = useMemo(() => {
        if (period === '7' || points.length === 0) return null;
        let minIdx = 0, maxIdx = 0;
        points.forEach((p, i) => {
            if (p.weight < points[minIdx].weight) minIdx = i;
            if (p.weight > points[maxIdx].weight) maxIdx = i;
        });
        const midIdx = Math.floor((points.length - 1) / 2);
        return new Set([0, points.length - 1, minIdx, maxIdx, midIdx]);
    }, [points, period]);

    const [activePoint, setActivePoint] = useState(null);

    const pan = useMemo(() => {
        const updateActivePoint = (touchX) => {
            if (!points.length) return;
            const localX = touchX - PAD_SIDE;
            let nearest = 0;
            let minDist = Infinity;
            points.forEach((p, i) => {
                const d = Math.abs(p.x - localX);
                if (d < minDist) { minDist = d; nearest = i; }
            });
            setActivePoint(nearest);
        };

        return Gesture.Pan()
            .enabled(period !== '7')
            .activeOffsetX([-10, 10])
            .failOffsetY([-15, 15])
            .onBegin((e) => { runOnJS(updateActivePoint)(e.x); })
            .onUpdate((e) => { runOnJS(updateActivePoint)(e.x); })
            .onFinalize(() => { runOnJS(setActivePoint)(null); });
    }, [points, period]);

    const active = (activePoint != null && activePoint < points.length) ? points[activePoint] : null;
    const tooltipLeft = active
        ? Math.min(Math.max(active.x + PAD_SIDE - TOOLTIP_WIDTH / 2, 0), width - TOOLTIP_WIDTH)
        : 0;

    const trendSeries = useMemo(() => {
        if (!data?.length) return [];
        const chronological = data
            .filter(e => e.weight > 0)
            .map(e => ({ date: new Date(e.date), weight: e.weight }))
            .sort((a, b) => a.date - b.date);
        return computeEmaSeries(chronological);
    }, [data]);

    const weekTrendDelta = useMemo(() => {
        if (period !== '7' || !trendSeries.length) return null;
        const weekStart = getLast7Days()[0];
        const atStart = trendSeries.find(e => e.date >= weekStart) ?? trendSeries[trendSeries.length - 1];
        const now = trendSeries[trendSeries.length - 1];
        return parseFloat((now.trendWeight - atStart.trendWeight).toFixed(2));
    }, [period, trendSeries]);

    const periodDelta = period === '7'
        ? weekTrendDelta
        : period === 'PHASE' && startWeight != null && points.length > 0
            ? points[points.length - 1].weight - startWeight
            : points.length > 1
                ? points[points.length - 1].weight - points[0].weight
                : null;

    const deltaSince = period === 'PHASE' && goalSwitchDate
        ? (formatExactDate(goalSwitchDate) ?? points[0]?.label)
        : points[0]?.label;

    const isGoodDelta = periodDelta != null && (isBulking ? periodDelta >= 0 : periodDelta <= 0);

    const deltaColor = periodDelta == null
        ? colors.text.primary
        : (isGoodDelta ? colors.accent.success : colors.accent.error);

    const deltaBg = periodDelta == null
        ? colors.faded.surface
        : (isGoodDelta ? colors.faded.successAlt : colors.faded.errorAlt);

    useEffect(() => {
        onDeltaChange?.(periodDelta != null
            ? { value: periodDelta, color: deltaColor, bg: deltaBg, since: deltaSince }
            : null);
    }, [periodDelta, deltaColor, deltaBg, deltaSince, onDeltaChange]);

    if (!points.length) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No data yet</Text>
                <Text style={styles.emptySub}>Start logging to see progress</Text>
            </View>
        );
    }

    return (
        <View style={{ width }}>
            <GestureDetector gesture={pan}>
                <View>
                    <Svg width={width} height={CHART_H}>
                        <G x={PAD_SIDE}>
                            <Path d={areaPath} fill={colors.accent.primary} fillOpacity={0.07} />
                            <Path
                                d={linePath}
                                stroke={colors.accent.primary}
                                strokeWidth="2"
                                fill="none"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />

                            {points.map(p => {
                                const isKeyPoint = !labeledIndices || labeledIndices.has(p.idx);
                                return (
                                    <React.Fragment key={p.key}>
                                        <Circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={labeledIndices ? (isKeyPoint ? 4 : 2.5) : 3.5}
                                            fill={colors.accent.primary}
                                            fillOpacity={labeledIndices ? (isKeyPoint ? 1 : 0.4) : 1}
                                        />
                                        {isKeyPoint && (
                                            <SvgText
                                                x={p.x}
                                                y={p.above ? p.y - 13 : p.y + 20}
                                                fontSize={9}
                                                fontWeight="700"
                                                fill={colors.accent.primary}
                                                textAnchor={labelAnchor(p.idx, p.total)}
                                            >
                                                {p.weight.toFixed(1)}
                                            </SvgText>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {active && (
                                <Line
                                    x1={active.x}
                                    y1={drawTop}
                                    x2={active.x}
                                    y2={drawBot}
                                    stroke={colors.text.quaternary}
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />
                            )}
                            {active && (
                                <Circle
                                    cx={active.x}
                                    cy={active.y}
                                    r={5}
                                    fill={colors.accent.primary}
                                    stroke={colors.background.primary}
                                    strokeWidth="2"
                                />
                            )}

                            {visibleLabels.map(l => (
                                <SvgText
                                    key={l.key}
                                    x={l.x}
                                    y={CHART_H - 10}
                                    fontSize={9}
                                    fontWeight="500"
                                    fill={colors.text.quaternary}
                                    textAnchor={labelAnchor(l.index, l.total)}
                                >
                                    {l.label}
                                </SvgText>
                            ))}
                        </G>
                    </Svg>

                    {active && (
                        <View
                            pointerEvents="none"
                            style={[styles.tooltip, { left: tooltipLeft, width: TOOLTIP_WIDTH }]}
                        >
                            <Text style={styles.tooltipLabel}>{active.label}</Text>
                            <Text style={styles.tooltipValue}>{active.weight.toFixed(1)} kg</Text>
                        </View>
                    )}
                </View>
            </GestureDetector>
        </View>
    );
};

const styles = createStyles(() => ({
    empty:      { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[1] },
    emptyTitle: { fontSize: fontSize[14], fontWeight: fontWeight.bold, color: colors.text.primary },
    emptySub:   { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },

    tooltip: {
        position:          'absolute',
        top:               PAD_TOP - 4,
        backgroundColor:   colors.background.primary,
        borderWidth:       1,
        borderColor:       colors.border.default,
        borderRadius:      8,
        paddingHorizontal: spacing[2],
        paddingVertical:   spacing[1],
        alignItems:        'center',
    },
    tooltipLabel: { fontSize: fontSize[10], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
    tooltipValue: { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.primary },
}));

export default WeightChart;