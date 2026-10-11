type UserDataLike = {
  age?: number;
  height?: number;
  gender?: string;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  experienceLevel?: string;
  stressLevel?: string;
  autoAdjustEnabled?: boolean;
  username?: string;
  email?: string;
  profilePicture?: string | null;
} | null | undefined;

export type ProfileFormSeed = {
  age: number;
  height: number;
  gender: string;
  currentWeight: number;
  targetWeight: number;
  activityLevel: string;
  experienceLevel: string;
  stressLevel: string;
  autoAdjustEnabled: boolean;
};

export type ProfileIdentitySeed = {
  username: string;
  email: string;
};

export const seedProfileForm = (userData: UserDataLike): ProfileFormSeed => ({
  age: userData?.age || 24,
  height: userData?.height || 175,
  gender: userData?.gender || 'male',
  currentWeight: userData?.currentWeight || 80,
  targetWeight: userData?.targetWeight || 80,
  activityLevel: userData?.activityLevel || 'moderately_active',
  experienceLevel: userData?.experienceLevel || 'intermediate',
  stressLevel: userData?.stressLevel || 'moderate',
  autoAdjustEnabled: userData?.autoAdjustEnabled ?? true,
});

export const seedProfileIdentity = (
  userData: UserDataLike,
  authEmail?: string | null,
): ProfileIdentitySeed => ({
  username: userData?.username || '',
  email: userData?.email || authEmail || '',
});

export const seedProfilePicture = (userData: UserDataLike): string | null =>
  userData?.profilePicture || null;
