import {
    formatExerciseHistoryDate,
    type ExerciseHistoryTimestamp,
} from './exerciseHistoryPresentation';

export type ExerciseHistoryChartSession = {
    timestamp?: ExerciseHistoryTimestamp;
    best: { e1rm: number };
};

export type ExerciseHistoryChartPoint = {
    x: number;
    y: number;
    label: string;
    i: number;
    total: number;
};

export type ExerciseHistoryChartModel = {
    points: ExerciseHistoryChartPoint[];
    showLabels: ExerciseHistoryChartPoint[];
    linePath: string;
    areaPath: string;
};

export const buildExerciseHistoryChartModel = (
    sessions: ExerciseHistoryChartSession[],
    chartWidth: number,
    drawTop: number,
    drawBottom: number,
): ExerciseHistoryChartModel | null => {
    if (sessions.length < 2) return null;

    const chronologicalSessions = [...sessions].reverse();
    const values = chronologicalSessions.map(session => session.best.e1rm);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const verticalPad = Math.max((max - min) * 0.3, 5);
    const yMin = min - verticalPad;
    const yMax = max + verticalPad;
    const lastIndex = chronologicalSessions.length - 1;
    const points = chronologicalSessions.map((session, index) => ({
        x: lastIndex === 0 ? chartWidth / 2 : (index / lastIndex) * chartWidth,
        y: drawTop + (1 - (session.best.e1rm - yMin) / (yMax - yMin || 1)) *
            (drawBottom - drawTop),
        label: formatExerciseHistoryDate(session.timestamp).label.split(',')[0],
        i: index,
        total: chronologicalSessions.length,
    }));

    const linePath = points
        .map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
        )
        .join(' ');
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${drawBottom} L ${firstPoint.x.toFixed(1)} ${drawBottom} Z`;
    const showLabels = points.length <= 6
        ? points
        : points.filter((_, index) =>
            index === 0 ||
            index === points.length - 1 ||
            index % Math.ceil(points.length / 4) === 0,
        );

    return { points, showLabels, linePath, areaPath };
};
