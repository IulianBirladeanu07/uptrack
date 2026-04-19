import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontSize, fontWeight } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHART_H = 150;
const CHART_PADDING = { top: 36, bottom: 32, left: 8, right: 8 };

export const PERIODS = [
    { key: '7', label: 'Week', days: 7 },
    { key: '30', label: 'Month', days: 30 },
    { key: '365', label: 'Year', days: 365 },
];

const buildPath = (points) => {
    if (points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
};

const DRAW_BOTTOM = CHART_H - CHART_PADDING.bottom;

const buildAreaPath = (linePath, points) => {
    if (!linePath) return '';
    return `${linePath} L ${points[points.length - 1].x} ${DRAW_BOTTOM} L ${points[0].x} ${DRAW_BOTTOM} Z`;
};

const formatLabel = (dateStr, period) => {
    const d = new Date(dateStr);
    if (period === '7') return d.toLocaleDateString('en-US', { weekday: 'short' });
    if (period === '365') return d.toLocaleDateString('en-US', { month: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const WeightChart = ({ data, period }) => {
    const chartWidth = SCREEN_WIDTH - (spacing[4] * 4) - CHART_PADDING.left - CHART_PADDING.right;

    const { points, xLabels } = useMemo(() => {
        if (!data?.length) return { points: [], xLabels: [] };

        const days = PERIODS.find(p => p.key === period)?.days ?? 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days - 1));
        cutoff.setHours(0, 0, 0, 0);

        let valid = data
            .filter(d => d.weight > 0 && new Date(d.date) >= cutoff)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (valid.length < 2) return { points: [], xLabels: [] };

        if (period === '30') {
            const thisMonth = new Date();
            const thisMonthYear = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`;

            const weeks = {};
            valid.forEach(item => {
                const weekStart = item.weekStart || (() => {
                    const itemDate = new Date(item.date);
                    const start = new Date(itemDate);
                    const day = itemDate.getDay();
                    start.setDate(itemDate.getDate() - (day === 0 ? 6 : day - 1));
                    start.setHours(0, 0, 0, 0);
                    return start.toISOString().split('T')[0];
                })();

                if (!weeks[weekStart]) weeks[weekStart] = [];
                weeks[weekStart].push(item.weight);
            });

            valid = Object.entries(weeks)
                .filter(([dateStr]) => dateStr.startsWith(thisMonthYear))
                .map(([dateStr, weights]) => ({
                    date: dateStr,
                    weight: weights.reduce((a, b) => a + b, 0) / weights.length,
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        const weights = valid.map(d => d.weight);
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);
        const range = maxW - minW || 1;
        const drawH = CHART_H - CHART_PADDING.top - CHART_PADDING.bottom;

        const pts = valid.map((item, i) => ({
            x: CHART_PADDING.left + (i / (valid.length - 1)) * chartWidth,
            y: CHART_PADDING.top + (1 - (item.weight - minW) / range) * drawH,
            weight: item.weight,
            date: item.date,
        }));

        const maxLabels = period === '7' ? 7 : period === '30' ? 4 : 6;
        const step = Math.max(1, Math.floor(valid.length / maxLabels));
        const labels = valid
            .filter((_, i) => i === 0 || i === valid.length - 1 || i % step === 0)
            .map(d => ({
                label: formatLabel(d.date, period),
                x: pts[valid.indexOf(d)].x,
                key: d.date,
            }));

        return { points: pts, xLabels: labels };
    }, [data, period, chartWidth]);

    const linePath = useMemo(() => buildPath(points), [points]);
    const areaPath = useMemo(() => buildAreaPath(linePath, points), [linePath, points]);

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
            <Svg width={chartWidth + CHART_PADDING.left + CHART_PADDING.right} height={CHART_H}>
                <Path d={areaPath} fill={colors.accent.primary} fillOpacity={0.08} />
                <Path
                    d={linePath}
                    stroke={colors.accent.primary}
                    strokeWidth="2"
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {points.map((p, i) => (
                    <React.Fragment key={p.date}>
                        <Circle
                            cx={p.x}
                            cy={p.y}
                            r={3}
                            fill={colors.accent.primary}
                        />
                        <SvgText
                            x={p.x}
                            y={p.y - 12}
                            fontSize={8}
                            fontWeight="700"
                            fill={colors.accent.primary}
                            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                        >
                            {p.weight.toFixed(1)}
                        </SvgText>
                    </React.Fragment>
                ))}

                {xLabels.map((l, i) => (
                    <SvgText
                        key={l.key}
                        x={l.x}
                        y={CHART_H - 6}
                        fontSize={8}
                        fontWeight="500"
                        fill={colors.text.quaternary}
                        textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
                    >
                        {l.label}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
};

const styles = createStyles(() => ({
    empty: { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[1] },
    emptyTitle: { fontSize: fontSize[14], fontWeight: fontWeight.bold, color: colors.text.primary },
    emptySub: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.quaternary },
}));

export default WeightChart;