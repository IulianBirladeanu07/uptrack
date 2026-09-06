# Future: maintenance goal support in weight tracking UI

Status: not started, not scheduled. Written after adding Cut/Bulk phase
tracking, deferred because there is no current maintenance-goal usage to
justify it. Pick this up only once maintenance is actually the active
`weightChangePlan.type` for the account, or the user asks for it directly.

## Problem

Every place that colors a weight-change delta green/red, or decides which
direction is "good", derives it from one inline boolean:

```js
const isBulking = goalWeight != null && startWeight != null && goalWeight > startWeight;
```

This assumes exactly two states: trending down is good (cut) or trending
up is good (bulk). `weightChangePlan.type` already supports a third value,
`'maintenance'` (see `nutritionPlanEngine.js`, `SettingsScreen.js`,
`PlanSummaryScreen.js` — it is a real, selectable, first-class goal type,
not a hypothetical). When `goalWeight === startWeight`, `isBulking`
evaluates `false`, so a maintenance phase gets treated as a cut: any gain
shows red, any loss shows green, even though neither is actually wrong
during maintenance. The real question during maintenance isn't direction,
it's magnitude — did you drift, or did you actually hold flat.

## Every current call site (grep for `isBulking`, all three files)

- `WeightTracker.js`
  - `isBulking` computed (goalWeight vs startWeight comparison)
  - `PHASE` tab label: `isBulking ? 'Bulk' : 'Cut'` — needs a third branch
  - `PHASE_WEEKLY_CAP` selection in `WeightChart.js` (cut vs bulk cap) —
    needs a decision for maintenance (probably same cap as cut, no strong
    reason to diverge)
  - Hero card `weekChangeColor` / `weekChangeDelta` coloring
  - `TrendBadge` (History list rows) — `isGood = isBulking ? value > 0 : value < 0`
- `WeightHistoryScreen.js`
  - `TrendChip` — same directional `isGood` logic, duplicated
  - Total-change coloring (`isBulking ? totalChange > 0 : totalChange < 0`)
- `WeightChart.js`
  - `isGoodDelta` for the phase/period delta pill color
  - `weeklyCap` selection for phase bucket granularity

## What would actually need to change

1. Stop inferring direction from `goalWeight > startWeight`. Read
   `weightChangePlan.type` directly instead — it's already the source of
   truth and doesn't break on `goalWeight === startWeight` floating-point
   edge cases. Replace the boolean with something like
   `goalDirection: 'cut' | 'bulk' | 'maintain'`.
2. Every `isBulking ? X : Y` ternary above becomes a three-way branch.
   For maintenance, "good" is not `value > 0` or `value < 0` — it's
   `Math.abs(value) <= TOLERANCE`. `TOLERANCE` doesn't exist yet and has
   no obvious right value; it needs to be picked (something like
   ±0.3-0.5kg/week is a reasonable starting guess, not a researched one).
3. Tab label: `'Bulk' / 'Cut'` becomes `'Bulk' / 'Cut' / 'Maintain'`.
4. Decide whether `getAvailablePeriods`/phase-tab visibility logic changes
   at all for maintenance — probably not, it's already goal-agnostic
   (keys off `goalSwitchDate`, not off direction).

## What NOT to do

Don't touch this preemptively "just in case." The three call sites already
work correctly for the only two goal types actually in use (cut, bulk).
Changing the direction-inference mechanism without a maintenance phase to
test against risks introducing a regression in the cut/bulk path for a
feature nobody is using yet.