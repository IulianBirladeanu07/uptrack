import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { colors, spacing, fontSize, fontWeight } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PERIODS = [
    { key: '7',  label: 'Week' },
    { key: '4W', label: '4W'   },
    { key: '8W', label: '8W'   },
];

const CHART_H    = 160;
const PAD_TOP    = 10;
const PAD_BOTTOM = 40;
const PAD_SIDE   = 12;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const WeightChart = ({ data, period }) => {
    const outerW  = SCREEN_WIDTH - spacing[4] * 4 + spacing[3];
    const drawW   = outerW - PAD_SIDE * 2;
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
                above:  idx % 2 === 0,
                idx,
                total:  present.length,
            }));

            const labels = slots.map((s, i) => ({
                x: (s.i / n) * drawW, label: s.label, key: s.key, index: i, total: slots.length,
            }));

            return { points: pts, xLabels: labels };
        }

        const weekCount = period === '4W' ? 4 : 8;
        const allSlots  = [];

        for (let i = weekCount - 1; i >= 0; i--) {
            const monday = getMonday(-i);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            const entries = data.filter(e => {
                if (!e.weight || e.weight <= 0) return false;
                const d = new Date(e.date);
                return d >= monday && d <= sunday;
            });

            const avg = entries.length
                ? entries.reduce((s, e) => s + e.weight, 0) / entries.length
                : null;

            allSlots.push({
                avg,
                slot:  weekCount - 1 - i,
                label: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                key:   toDateKey(monday),
            });
        }

        const present = allSlots.filter(w => w.avg != null);
        if (!present.length) return { points: [], xLabels: [] };

        const { yMin, yMax } = getYScale(present.map(w => w.avg));
        const n = weekCount - 1;

        const pts = present.map((w, idx) => ({
            x:      (w.slot / n) * drawW,
            y:      toY(w.avg, yMin, yMax, drawTop, drawBot),
            key:    w.key,
            weight: w.avg,
            above:  idx % 2 === 0,
            idx,
            total:  present.length,
        }));

        const labels = allSlots.map((w, i) => ({
            x: (w.slot / n) * drawW, label: w.label, key: w.key, index: i, total: allSlots.length,
        }));

        return { points: pts, xLabels: labels };
    }, [data, period, drawW, drawTop, drawBot]);

    const linePath = useMemo(() => buildLinePath(points), [points]);
    const areaPath = useMemo(() => buildAreaPath(linePath, points, drawBot), [linePath, points, drawBot]);

    if (!points.length) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No data yet</Text>
                <Text style={styles.emptySub}>Start logging to see progress</Text>
            </View>
        );
    }

    return (
        <View>
            <Svg width={outerW} height={CHART_H}>
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

                    {points.map(p => (
                        <React.Fragment key={p.key}>
                            <Circle cx={p.x} cy={p.y} r={3.5} fill={colors.accent.primary} />
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
                        </React.Fragment>
                    ))}

                    {xLabels
                        .filter((_, i) => period !== '8W' || i % 2 === 0)
                        .map(l => (
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
        </View>
    );
};

const styles = createStyles(() => ({
    empty:      { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[1] },
    emptyTitle: { fontSize: fontSize[14], fontWeight: fontWeight.bold, color: colors.text.primary },
    emptySub:   { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },
}));

export default WeightChart;