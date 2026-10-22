export const resolveCalorieTarget = (hasTargets: boolean, targetCalories: number | null | undefined): number | null =>
    hasTargets && targetCalories != null && targetCalories > 0 ? Math.round(targetCalories) : null;

export const learningProgressLabel = (daysLogged: number, requiredDays: number): string => {
    const logged = Math.max(0, Math.min(Math.round(daysLogged), requiredDays));
    return logged >= requiredDays ? 'Setting your targets' : `Learning · ${logged} of ${requiredDays} days logged`;
};
