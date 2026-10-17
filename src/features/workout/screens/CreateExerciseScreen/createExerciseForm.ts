export type ExerciseFormData = {
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
};

export type FormField = keyof ExerciseFormData;
export type FormErrors = Partial<Record<FormField, string | null>>;
export type PickerType = keyof typeof EXERCISE_DATA;
export type PickerOption = (typeof EXERCISE_DATA)[PickerType][number];

export const EXERCISE_DATA = {
  muscleGroups: [
    { name: 'Back', icon: 'barbell-outline', desc: 'Lats, rhomboids, traps', color: '#3B82F6' },
    { name: 'Biceps', icon: 'analytics-outline', desc: 'Bicep brachii, brachialis', color: '#8B5CF6' },
    { name: 'Calves', icon: 'walk-outline', desc: 'Gastrocnie, soleus', color: '#F59E0B' },
    { name: 'Chest', icon: 'albums-outline', desc: 'Pectorals, deltoids', color: '#EF4444' },
    { name: 'Core', icon: 'scan-outline', desc: 'Abs, obliques, transverse', color: '#10B981' },
    { name: 'Glutes', icon: 'fitness-outline', desc: 'Gluteus maximus, medius', color: '#F97316' },
    { name: 'Hamstring', icon: 'footsteps-outline', desc: 'Bicep femoris group', color: '#84CC16' },
    { name: 'Legs', icon: 'walk-outline', desc: 'Full leg workout', color: '#06B6D4' },
    { name: 'Quads', icon: 'footsteps-outline', desc: 'Rectus femoris, vastus', color: '#8B5CF6' },
    { name: 'Shoulders', icon: 'aperture-outline', desc: 'Deltoids, rotator cuff', color: '#F59E0B' },
    { name: 'Triceps', icon: 'analytics-outline', desc: 'Tricep brachii', color: '#EF4444' },
    { name: 'Full Body', icon: 'body-outline', desc: 'Complete body workout', color: '#DC2626' }
  ],
  equipment: [
    { name: 'Bodyweight', icon: 'body-outline', desc: 'No equipment needed', color: '#10B981' },
    { name: 'Barbell', icon: 'barbell-outline', desc: 'Olympic or standard barbell', color: '#6B7280' },
    { name: 'Dumbbell', icon: 'hardware-chip-outline', desc: 'Adjustable or fixed weights', color: '#374151' },
    { name: 'Cable', icon: 'git-compare-outline', desc: 'Cable machine system', color: '#F59E0B' },
    { name: 'Machine', icon: 'settings-outline', desc: 'Gym machines', color: '#8B5CF6' },
    { name: 'Resistance Band', icon: 'reload-outline', desc: 'Elastic resistance bands', color: '#06B6D4' },
    { name: 'Kettlebell', icon: 'stopwatch-outline', desc: 'Cast iron weights', color: '#DC2626' },
    { name: 'Smith Machine', icon: 'grid-outline', desc: 'Guided barbell system', color: '#9CA3AF' },
    { name: 'Other', icon: 'ellipsis-horizontal-circle-outline', desc: 'Custom equipment', color: '#6B7280' }
  ],
  categories: [
    { name: 'Compound', icon: 'apps-outline', desc: 'Multi-joint movements', color: '#DC2626' },
    { name: 'Isolation', icon: 'square-outline', desc: 'Single-joint movements', color: '#8B5CF6' },
    { name: 'Cardio', icon: 'heart-outline', desc: 'Cardiovascular exercise', color: '#EF4444' },
    { name: 'Stretching', icon: 'contract-outline', desc: 'Flexibility and mobility', color: '#10B981' }
  ]
} as const;

const TOTAL_FIELDS = 4;

export const createEmptyExerciseForm = (): ExerciseFormData => ({
  name: '',
  muscleGroup: '',
  equipment: '',
  category: ''
});

export const getFormProgress = (formData: ExerciseFormData) => {
  let filled = 0;
  if (formData.name.trim()) filled++;
  if (formData.muscleGroup) filled++;
  if (formData.equipment) filled++;
  if (formData.category) filled++;
  return filled / TOTAL_FIELDS;
};

export const validateExerciseForm = (formData: ExerciseFormData) => {
  const errors: FormErrors = {};
  const name = formData.name.trim();
  if (!name) errors.name = 'Exercise name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (name.length > 50) errors.name = 'Name must be less than 50 characters';
  if (!formData.muscleGroup) errors.muscleGroup = 'Please select a muscle group';
  if (!formData.equipment) errors.equipment = 'Please select equipment type';
  if (!formData.category) errors.category = 'Please select exercise type';
  return errors;
};

export const buildCustomExercisePayload = (formData: ExerciseFormData) => ({
  name: formData.name.trim(),
  muscleGroup: formData.muscleGroup,
  equipment: formData.equipment,
  category: formData.category,
  imageURL: '',
  difficulty: 'Intermediate',
});

export const filterPickerOptions = (options: readonly PickerOption[], searchQuery: string) => {
  if (!searchQuery) return options;
  const query = searchQuery.toLowerCase();
  return options.filter(opt =>
    opt.name.toLowerCase().includes(query) ||
    opt.desc.toLowerCase().includes(query)
  );
};
