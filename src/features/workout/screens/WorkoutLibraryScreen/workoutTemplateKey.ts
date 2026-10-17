type WorkoutTemplateKeySource = {
    id?: string;
    data?: { id?: string };
};

export const getWorkoutTemplateKey = (
    template: WorkoutTemplateKeySource,
    index: number,
): string => template.id || template.data?.id || `template-${index}`;
