export const calculate1RM = (weight: number, reps: number): number => {
    const clampedReps = Math.min(Math.max(reps, 1), 12);
    return weight / (1.0278 - 0.0278 * clampedReps);
};

export const formatBestSet = (set: { weight?: number | string; reps?: number | string }): string | null => {
    const weight = parseFloat(String(set.weight ?? 0));
    const reps = parseInt(String(set.reps ?? 0), 10);
    if (!Number.isFinite(reps) || reps <= 0) return null;
    return Number.isFinite(weight) && weight > 0 ? `${weight}kg × ${reps}` : `${reps} reps`;
};

export const findBestSet = (
    sets: Array<{ weight?: number | string; reps?: number | string; estimated1RM?: number | string }>
): { weight: number; reps: number; estimated1RM: number } => {
    const best = sets.reduce<{ weight: number; reps: number; estimated1RM: number }>((currentBest, set) => {
        const weight = parseFloat(String(set.weight ?? 0));
        const reps = parseInt(String(set.reps ?? 0), 10);
        const estimated1RM = calculate1RM(weight, reps);
        return estimated1RM > currentBest.estimated1RM ||
            (weight <= 0 && currentBest.weight <= 0 && reps > currentBest.reps)
            ? { weight: Number(set.weight) || 0, reps: Number(set.reps) || 0, estimated1RM }
            : currentBest;
    }, { weight: 0, reps: 0, estimated1RM: -1 });

    return best.estimated1RM < 0 ? { weight: 0, reps: 0, estimated1RM: 0 } : best;
};

export const getPersonalRecordSetIndexes = (
    currentSets: Array<{ weight?: number | string; reps?: number | string }>,
    previousSets: Array<{ weight?: number | string; reps?: number | string }>,
): number[] => {
    const current = currentSets.flatMap((set, index) => {
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        return Number.isFinite(weight) && weight >= 0 && Number.isInteger(reps) && reps > 0
            ? [{ index, weight, reps }]
            : [];
    });
    const previous = previousSets.flatMap(set => {
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        return Number.isFinite(weight) && weight >= 0 && Number.isInteger(reps) && reps > 0
            ? [{ weight, reps }]
            : [];
    });
    if (current.length === 0) return [];

    if (current.some(set => set.weight > 0) || previous.some(set => set.weight > 0)) {
        const best = Math.max(...current.map(set => calculate1RM(set.weight, set.reps)));
        const previousBest = previous.length
            ? Math.max(...previous.map(set => calculate1RM(set.weight, set.reps)))
            : 0;
        if (best <= previousBest) return [];
        return current
            .filter(set => Math.abs(calculate1RM(set.weight, set.reps) - best) < 0.01)
            .map(set => set.index);
    }

    const bestReps = Math.max(...current.map(set => set.reps));
    const previousBestReps = previous.length ? Math.max(...previous.map(set => set.reps)) : 0;
    return bestReps > previousBestReps
        ? current.filter(set => set.reps === bestReps).map(set => set.index)
        : [];
};
