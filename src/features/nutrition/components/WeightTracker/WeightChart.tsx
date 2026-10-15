import { Fragment, useMemo, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, spacing, fontSize, fontWeight } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import { differenceInLocalDays, formatDate, getLocalDateBucket, toLocalDate } from '../../utils/dateUtils';

export type PeriodKey = '7' | 'PHASE' | '6M' | 'ALL';
type DateInput = string | Date;
export type ChartEntry = { date: DateInput; weight: number };
export type ChartDelta = { value: number; color: string; bg: string; caption: string };
type Unit = 'week' | 'month' | 'quarter';
type DaySlot = { key: string; i: number; label: string; weight: number | null };
type BucketSlot = { avg: number | null; slot: number; label: string | null; key: string };
type ChartPoint = {
    x: number;
    y: number;
    key: string;
    weight: number;
    label: string | null;
    idx: number;
    total: number;
    above?: boolean;
};
type XLabel = { x: number; label: string | null; key: string; index: number; total: number };
type WeightChartProps = {
    data?: ChartEntry[] | undefined;
    period: PeriodKey;
    isBulking?: boolean | undefined;
    width: number;
    onDeltaChange?: ((delta: ChartDelta | null) => void) | undefined;
    goalSwitchDate?: DateInput | null | undefined;
    startWeight?: number | null | undefined;
};

export const PERIODS: { key: PeriodKey; label: string }[] = [
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

const PERIOD_SPAN_WEEKS: Partial<Record<PeriodKey, number>> = {
    '6M': 26,
};

const getEarliestDate = (data: ChartEntry[]) =>
    data.reduce((min, e) => {
        const d = toLocalDate(e.date);
        return d < min ? d : min;
    }, new Date());

const getDataWeeks = (data: ChartEntry[]) =>
    Math.max(1, Math.ceil(differenceInLocalDays(new Date(), getEarliestDate(data)) / 7));

const getPhaseSpanWeeks = (goalSwitchDate: DateInput | null | undefined) => {
    if (!goalSwitchDate) return null;
    const switchDate = toLocalDate(goalSwitchDate);
    if (isNaN(switchDate.getTime())) return null;
    const diffDays = differenceInLocalDays(new Date(), switchDate);
    if (diffDays <= 0) return null;
    return Math.max(1, Math.ceil(diffDays / 7));
};

export const getAvailablePeriods = (data: ChartEntry[] | undefined, goalSwitchDate: DateInput | null | undefined) => {
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

const getLast7Days = () => {
    const days: Date[] = [];
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

const buildLinePath = (pts: Pick<ChartPoint, 'x' | 'y'>[]) => {
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
};

const buildAreaPath = (linePath: string, pts: Pick<ChartPoint, 'x' | 'y'>[], drawBot: number) => {
    if (!linePath || pts.length < 2) return '';
    return `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${drawBot} L ${pts[0].x.toFixed(1)} ${drawBot} Z`;
};

const getYScale = (weights: number[]) => {
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const pad = Math.max((max - min) * 0.4, 0.8);
    return { yMin: min - pad, yMax: max + pad };
};

const toY = (w: number, yMin: number, yMax: number, top: number, bottom: number) =>
    top + (1 - (w - yMin) / (yMax - yMin || 1)) * (bottom - top);

const labelAnchor = (i: number, total: number): 'start' | 'middle' | 'end' =>
    i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle';

const getLabelAbove = (pts: ChartPoint[], i: number) => {
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

const resolveGranularity = (spanWeeks: number, weeklyCap = MAX_POINTS): { unit: Unit; count: number } => {
    if (spanWeeks <= weeklyCap) return { unit: 'week', count: spanWeeks };
    const months = Math.ceil(spanWeeks / 4.345);
    if (months <= MAX_POINTS) return { unit: 'month', count: months };
    return { unit: 'quarter', count: Math.ceil(spanWeeks / 13) };
};

const getSpanWeeks = (period: PeriodKey, data: ChartEntry[], goalSwitchDate: DateInput | null | undefined) => {
    const dataWeeks = getDataWeeks(data);

    if (period === 'PHASE') {
        const phaseWeeks = getPhaseSpanWeeks(goalSwitchDate) ?? dataWeeks;
        return Math.min(phaseWeeks, dataWeeks);
    }

    const maxWeeks = PERIOD_SPAN_WEEKS[period] ?? Infinity;
    return Math.min(maxWeeks, dataWeeks);
};

const getBucketRange = (unit: Unit, offset: number) => {
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

const formatBucketLabel = (unit: Unit, start: Date) => {
    if (unit === 'week')  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (unit === 'month') return start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `Q${q} '${String(start.getFullYear()).slice(2)}`;
};

const pickEvenLabels = <T,>(labels: T[], max: number): T[] => {
    if (labels.length <= max) return labels;
    const step   = (labels.length - 1) / (max - 1);
    const idxSet = new Set<number>();
    for (let i = 0; i < max; i++) idxSet.add(Math.round(i * step));
    return labels.filter((_, i) => idxSet.has(i));
};

const formatExactDate = (dateStr: DateInput) => {
    const d = toLocalDate(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const WeightChart = ({ data, period, isBulking, width, onDeltaChange, goalSwitchDate, startWeight }: WeightChartProps) => {
    const drawW   = width - PAD_SIDE * 2;
    const drawTop = PAD_TOP;
    const drawBot = CHART_H - PAD_BOTTOM;

    const { points, xLabels } = useMemo<{ points: ChartPoint[]; xLabels: XLabel[] }>(() => {
        if (!data?.length) return { points: [], xLabels: [] };

        if (period === '7') {
            const days   = getLast7Days();
            const byDate: Record<string, number> = {};
            data.forEach(e => {
                const key = formatDate(e.date);
                if (e.weight > 0) byDate[key] = e.weight;
            });

            const slots = days.map((d, i) => ({
                key:    formatDate(d),
                i,
                label:  DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
                weight: byDate[formatDate(d)] ?? null,
            }));

            const present = slots.filter((s): s is DaySlot & { weight: number } => s.weight != null);
            if (!present.length) return { points: [], xLabels: [] };

            const { yMin, yMax } = getYScale(present.map(s => s.weight));
            const n = slots.length - 1;

            const pts: ChartPoint[] = present.map((s, idx) => ({
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
        const allSlots: BucketSlot[] = [];

        const anchor = period === 'PHASE' && goalSwitchDate ? toLocalDate(goalSwitchDate) : null;
        if (anchor) anchor.setHours(0, 0, 0, 0);
        const hasAnchor = anchor && !isNaN(anchor.getTime()) && startWeight != null;

        if (hasAnchor) {
            const bucketDays = (unit === 'week' ? WEEK_MS : unit === 'month' ? WEEK_MS * 4.345 : WEEK_MS * 13)
                / (24 * 60 * 60 * 1000);

            allSlots.push({
                avg:   startWeight,
                slot:  0,
                label: formatExactDate(anchor),
                key:   formatDate(anchor),
            });

            for (let i = 0; i < count; i++) {
                const { start, end: bucketEnd } = getLocalDateBucket(anchor, i, bucketDays);
                if (start.getTime() > Date.now()) break;
                const end = new Date(Math.min(bucketEnd.getTime(), Date.now()));

                const entries = data.filter(e => {
                    if (!e.weight || e.weight <= 0) return false;
                    const d = toLocalDate(e.date);
                    return d >= start && d <= end;
                });

                const avg = entries.length
                    ? entries.reduce((s, e) => s + e.weight, 0) / entries.length
                    : null;

                allSlots.push({
                    avg,
                    slot:  i + 1,
                    label: formatBucketLabel(unit, end),
                    key:   formatDate(end),
                });
            }
        } else {
            for (let i = count - 1; i >= 0; i--) {
                const { start, end } = getBucketRange(unit, i);

                const entries = data.filter(e => {
                    if (!e.weight || e.weight <= 0) return false;
                    const d = toLocalDate(e.date);
                    return d >= start && d <= end;
                });

                const avg = entries.length
                    ? entries.reduce((s, e) => s + e.weight, 0) / entries.length
                    : null;

                allSlots.push({
                    avg,
                    slot:  count - 1 - i,
                    label: formatBucketLabel(unit, start),
                    key:   formatDate(start),
                });
            }
        }

        const present = allSlots.filter((s): s is BucketSlot & { avg: number } => s.avg != null);
        if (!present.length) return { points: [], xLabels: [] };

        const { yMin, yMax } = getYScale(present.map(s => s.avg));
        const n = Math.max(allSlots.length - 1, 1);

        const pts: ChartPoint[] = present.map((s, idx) => ({
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

    const [activePoint, setActivePoint] = useState<number | null>(null);

    const pan = useMemo(() => {
        const updateActivePoint = (touchX: number) => {
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

    const periodDelta = period === '7'
        ? null
        : period === 'PHASE' && startWeight != null && points.length > 0
            ? points[points.length - 1].weight - startWeight
            : points.length > 1
                ? points[points.length - 1].weight - points[0].weight
                : null;

    const deltaCaption = period === '7'
        ? 'trend this week'
        : `since ${period === 'PHASE' && goalSwitchDate ? (formatExactDate(goalSwitchDate) ?? points[0]?.label) : points[0]?.label}`;

    const isGoodDelta = periodDelta != null && (isBulking ? periodDelta >= 0 : periodDelta <= 0);

    const deltaColor = periodDelta == null
        ? colors.text.primary
        : (isGoodDelta ? colors.accent.success : colors.accent.error);

    const deltaBg = periodDelta == null
        ? colors.faded.surface
        : (isGoodDelta ? colors.faded.successAlt : colors.faded.errorAlt);

    useEffect(() => {
        onDeltaChange?.(periodDelta != null
            ? { value: periodDelta, color: deltaColor, bg: deltaBg, caption: deltaCaption }
            : null);
    }, [periodDelta, deltaColor, deltaBg, deltaCaption, onDeltaChange]);

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
                                    <Fragment key={p.key}>
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
                                    </Fragment>
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