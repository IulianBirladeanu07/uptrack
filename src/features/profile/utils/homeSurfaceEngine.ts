import type { HomeNotice, UserData } from '../../../shared/types';

const ADJUSTMENT_NOTICE_MAX_AGE_DAYS = 3;
const STEPS_PERMISSION_RENAG_DAYS = 7;

const daysBetween = (isoA: string | null | undefined, isoB = new Date().toISOString()): number => {
  if (!isoA) return Infinity;
  return (new Date(isoB).getTime() - new Date(isoA).getTime()) / 86400000;
};

const ADJUSTMENT_REASON_COPY: Record<string, string> = {
  too_slow: 'Your rate of progress slowed down, so we adjusted your calories to help.',
  too_fast: 'You were progressing faster than your target pace, so we eased your calories back.',
  plateau_at_min_calories: 'Progress has stalled and calories are already at the safe minimum.',
  steps_calibrated: 'We calibrated your calories using your actual step count.',
};

const getCutRaiseBody = (measuredTDEE: number | null | undefined, newTargetCalories: number): string => {
  const base = 'You were losing faster than planned, so we raised your target to slow the cut.';
  if (!measuredTDEE || measuredTDEE <= newTargetCalories) return base;
  return `${base} It is still ${measuredTDEE - newTargetCalories} kcal under your measured maintenance of ${measuredTDEE}.`;
};

export const getCalorieAdjustmentNotice = (
  userData: UserData | null | undefined,
  dismissedAdjustmentTimestamps: string[] = [],
): HomeNotice | null => {
  const adjustment = userData?.lastCalorieAdjustment;
  if (!adjustment?.adjustedAt) return null;
  if (adjustment.reason === 'goal_reached') return null;
  if (!adjustment.newTargetCalories) return null;
  if (daysBetween(adjustment.adjustedAt) > ADJUSTMENT_NOTICE_MAX_AGE_DAYS) return null;
  if (dismissedAdjustmentTimestamps.includes(adjustment.adjustedAt)) return null;

  const isCutRaise =
    userData?.weightChangePlan?.type === 'weight_loss' &&
    adjustment.reason === 'too_fast' &&
    (adjustment.adjustment ?? 0) > 0;

  if (isCutRaise) {
    return {
      id: `calorie_adjustment_${adjustment.adjustedAt}`,
      type: 'calorie_adjustment',
      title: `Calories raised to ${adjustment.newTargetCalories} to slow your cut`,
      body: getCutRaiseBody(adjustment.measuredTDEE, adjustment.newTargetCalories),
      dismissKey: adjustment.adjustedAt,
    };
  }

  return {
    id: `calorie_adjustment_${adjustment.adjustedAt}`,
    type: 'calorie_adjustment',
    title: (adjustment.adjustment ?? 0) > 0
      ? `Calories increased to ${adjustment.newTargetCalories}`
      : `Calories adjusted to ${adjustment.newTargetCalories}`,
    body: ADJUSTMENT_REASON_COPY[adjustment.reason ?? ''] || 'Your plan was updated based on your recent progress.',
    dismissKey: adjustment.adjustedAt,
  };
};

export const getGoalReachedNotice = (userData: UserData | null | undefined, dismissed = false): HomeNotice | null => {
  if (dismissed) return null;
  if (userData?.lastCalorieAdjustment?.reason !== 'goal_reached') return null;

  return {
    id: 'goal_reached',
    type: 'goal_reached',
    title: "You've reached your goal weight",
    body: 'Set a new target or switch to maintaining your current weight.',
  };
};

export const getStepsPermissionNotice = (
  stepsConnected: boolean,
  dismissedAt: string | null = null,
  stepsLoading = false,
): HomeNotice | null => {
  if (stepsConnected || stepsLoading) return null;
  if (dismissedAt && daysBetween(dismissedAt) < STEPS_PERMISSION_RENAG_DAYS) return null;

  return {
    id: 'steps_permission',
    type: 'steps_permission',
    title: 'Track steps automatically',
    body: 'Connect Google Fit or Apple Health so we can factor your activity into your plan.',
  };
};

export const getHomeNotices = ({
  userData,
  stepsConnected,
  stepsLoading,
  dismissedAdjustmentTimestamps,
  stepsPermissionDismissedAt,
  goalReachedDismissed,
}: {
  userData: UserData | null | undefined;
  stepsConnected: boolean;
  stepsLoading?: boolean;
  dismissedAdjustmentTimestamps?: string[];
  stepsPermissionDismissedAt?: string | null;
  goalReachedDismissed?: boolean;
}): HomeNotice[] => {
  const notices: HomeNotice[] = [];

  const goalReached = getGoalReachedNotice(userData, goalReachedDismissed);
  if (goalReached) notices.push(goalReached);

  if (!goalReached) {
    const adjustment = getCalorieAdjustmentNotice(userData, dismissedAdjustmentTimestamps);
    if (adjustment) notices.push(adjustment);
  }

  const stepsPermission = getStepsPermissionNotice(stepsConnected, stepsPermissionDismissedAt, stepsLoading);
  if (stepsPermission) notices.push(stepsPermission);

  return notices;
};
