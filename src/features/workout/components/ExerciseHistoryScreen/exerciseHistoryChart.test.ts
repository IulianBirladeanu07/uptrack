import { buildExerciseHistoryChartModel } from './exerciseHistoryChart';

describe('exercise history chart model', () => {
    it('returns no model until there are at least two sessions', () => {
        expect(buildExerciseHistoryChartModel([], 100, 8, 72)).toBeNull();
        expect(buildExerciseHistoryChartModel([{ best: { e1rm: 100 } }], 100, 8, 72)).toBeNull();
    });

    it('reverses newest-first history and scales points within chart bounds', () => {
        const model = buildExerciseHistoryChartModel([
            { best: { e1rm: 125 } },
            { best: { e1rm: 150 } },
            { best: { e1rm: 100 } },
        ], 100, 8, 72);

        expect(model?.points.map(point => point.x)).toEqual([0, 50, 100]);
        expect(model?.points[0].y).toBe(60);
        expect(model?.points[1].y).toBe(20);
        expect(model?.points[2].y).toBeCloseTo(40);
        expect(model?.points.map(point => point.label)).toEqual(['Recent', 'Recent', 'Recent']);
        expect(model?.linePath).toMatch(/^M 0\.0 60\.0 L 50\.0 20\.0 L 100\.0 /);
        expect(model?.areaPath).toContain(' L 100.0 72 L 0.0 72 Z');
    });

    it('keeps all labels for short histories and applies sparse selection for longer histories', () => {
        const sixSessions = Array.from({ length: 6 }, (_, index) => ({
            best: { e1rm: 100 + index },
        }));
        const sevenSessions = Array.from({ length: 7 }, (_, index) => ({
            best: { e1rm: 100 + index },
        }));

        expect(buildExerciseHistoryChartModel(sixSessions, 120, 8, 72)?.showLabels).toHaveLength(6);
        expect(buildExerciseHistoryChartModel(sevenSessions, 120, 8, 72)?.showLabels.map(point => point.i))
            .toEqual([0, 2, 4, 6]);
    });

    it('keeps full session values available for chart inspection', () => {
        const model = buildExerciseHistoryChartModel([
            {
                timestamp: { seconds: new Date(2026, 9, 26).getTime() / 1000 },
                best: { weight: 35, reps: 11, e1rm: 48.5 },
            },
            {
                timestamp: { seconds: new Date(2026, 9, 19).getTime() / 1000 },
                best: { weight: 32.5, reps: 10, e1rm: 43.3 },
            },
        ], 100, 8, 72);

        expect(model?.points[0]).toMatchObject({
            tooltipLabel: 'Oct 19, 2026',
            weight: 32.5,
            reps: 10,
            e1rm: 43.3,
        });
        expect(model?.points[1]).toMatchObject({
            tooltipLabel: 'Oct 26, 2026',
            weight: 35,
            reps: 11,
            e1rm: 48.5,
        });
    });
});
