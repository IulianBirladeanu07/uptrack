import { getCurrentTrendWeight } from './weightTrendEngine';

const BF_RECHECK_WEIGHT_DELTA_PERCENT = 0.04;
const BF_RECHECK_MAX_WEEKS = 6;
const ADJUSTMENT_NOTICE_MAX_AGE_DAYS = 3;
const STEPS_PERMISSION_RENAG_DAYS = 7;

const daysBetween = (isoA, isoB = new Date().toISOString()) => {
  if (!isoA) return Infinity;
  return (new Date(isoB).getTime() - new Date(isoA).getTime()) / 86400000;
};

const ADJUSTMENT_REASON_COPY = {
  too_slow: 'Your rate of progress slowed down, so we adjusted your calories to help.',
  too_fast: 'You were progressing faster than your target pace, so we eased your calories back.',
  plateau_at_min_calories: 'Progress has stalled and calories are already at the safe minimum.',
  steps_calibrated: 'We calibrated your calories using your actual step count.',
};

export const getCalorieAdjustmentNotice = (userData, dismissedAdjustmentTimestamps = []) => {
  const adjustment = userData?.lastCalorieAdjustment;
  if (!adjustment?.adjustedAt) return null;
  if (adjustment.reason === 'goal_reached') return null;
  if (!adjustment.newTargetCalories) return null;
  if (daysBetween(adjustment.adjustedAt) > ADJUSTMENT_NOTICE_MAX_AGE_DAYS) return null;
  if (dismissedAdjustmentTimestamps.includes(adjustment.adjustedAt)) return null;

  return {
    id: `calorie_adjustment_${adjustment.adjustedAt}`,
    type: 'calorie_adjustment',
    title: adjustment.adjustment > 0
      ? `Calories increased to ${adjustment.newTargetCalories}`
      : `Calories adjusted to ${adjustment.newTargetCalories}`,
    body: ADJUSTMENT_REASON_COPY[adjustment.reason] || 'Your plan was updated based on your recent progress.',
    dismissKey: adjustment.adjustedAt,
  };
};

export const getGoalReachedNotice = (userData, dismissed = false) => {
  if (dismissed) return null;
  if (userData?.lastCalorieAdjustment?.reason !== 'goal_reached') return null;

  return {
    id: 'goal_reached',
    type: 'goal_reached',
    title: "You've reached your goal weight",
    body: 'Set a new target or switch to maintaining your current weight.',
  };
};

export const getBfRecheckNotice = (userData, snoozedUntil = null) => {
  if (!userData?.bfCategoryCollected) return null;
  if (snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()) return null;

  const currentTrendWeight = getCurrentTrendWeight(userData.weightIns) ?? userData.currentWeight;
  const weightAtSet = userData.bfCategoryWeightAtSet;
  const setAt = userData.bfCategorySetAt;
  if (currentTrendWeight == null || weightAtSet == null) return null;

  const weightDelta = Math.abs(currentTrendWeight - weightAtSet);
  const deltaThreshold = weightAtSet * BF_RECHECK_WEIGHT_DELTA_PERCENT;
  const weeksSinceSet = daysBetween(setAt) / 7;

  if (weightDelta < deltaThreshold && weeksSinceSet < BF_RECHECK_MAX_WEEKS) return null;

  return {
    id: 'bf_recheck',
    type: 'bf_recheck',
    title: 'Update your physique estimate?',
    body: `You've changed by ${weightDelta.toFixed(1)}kg since your last check-in. A quick update keeps your plan accurate.`,
  };
};

export const getStepsPermissionNotice = (stepsConnected, dismissedAt = null, stepsLoading = false) => {
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
  bfRecheckSnoozedUntil,
  stepsPermissionDismissedAt,
  goalReachedDismissed,
}) => {
  const notices = [];

  const goalReached = getGoalReachedNotice(userData, goalReachedDismissed);
  if (goalReached) notices.push(goalReached);

  if (!goalReached) {
    const adjustment = getCalorieAdjustmentNotice(userData, dismissedAdjustmentTimestamps);
    if (adjustment) notices.push(adjustment);
  }

  const bfRecheck = getBfRecheckNotice(userData, bfRecheckSnoozedUntil);
  if (bfRecheck) notices.push(bfRecheck);

  const stepsPermission = getStepsPermissionNotice(stepsConnected, stepsPermissionDismissedAt, stepsLoading);
  if (stepsPermission) notices.push(stepsPermission);

  return notices;
};