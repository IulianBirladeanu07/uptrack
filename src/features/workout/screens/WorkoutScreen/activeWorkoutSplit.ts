import type { WorkoutSplit } from '../../types';
import type { SplitLike } from '../../utils/splitSchedule';

export const selectActiveWorkoutSplit = (
    splits: WorkoutSplit[],
    activeSplitId?: string | null,
): SplitLike => {
    const raw = splits.find(split => split.id === activeSplitId) ?? splits[0];
    if (!raw) return null;

    const splitData = typeof raw.data === 'object' && raw.data !== null
        ? raw.data as Record<string, unknown>
        : undefined;
    const splitType = raw.type ?? (
        typeof splitData?.['type'] === 'string' ? splitData['type'] : undefined
    );

    return {
        ...(splitType ? { type: splitType } : {}),
        schedule: (raw.schedule ?? splitData?.['schedule'] ?? {}) as Exclude<
            NonNullable<SplitLike>['schedule'],
            null | undefined
        >,
    };
};
