export const isValidWorkoutSetInput = (
    weight: string | number | null | undefined,
    reps: string | number | null | undefined,
): boolean => {
    if (weight === null || weight === undefined || reps === null || reps === undefined) return false;

    const weightString = String(weight).trim();
    const repsString = String(reps).trim();
    if (!/^\d+\.?\d{0,2}$/.test(weightString) || !/^\d+$/.test(repsString)) return false;

    const parsedWeight = Number(weightString);
    const parsedReps = Number(repsString);
    return Number.isFinite(parsedWeight) &&
        parsedWeight <= 500 &&
        parsedReps >= 1 &&
        parsedReps <= 100;
};
