# Android steps: Google Fit → Health Connect

Status: implemented. Android reads steps from Health Connect through `src/shared/services/healthConnectSteps.ts`; `react-native-google-fit` and its config plugin are removed.
Deadline: Google Fit APIs supported until **end of 2026** (no exact day published). New Fit API signups closed 2024-05-01.

## What the app does today

| Platform | Library | Role |
|---|---|---|
| Android | `react-native-google-fit` ^0.21.0 | Authorize + `getDailyStepCountSamples` for today and ~30-day history |
| iOS | `react-native-health` ^1.19.0 | HealthKit steps (unchanged by this migration) |
| Config | `plugins/withGoogleFitVersions.js` | Pins Play Services Auth 20.7.0 / Fitness 21.1.0 |
| UI entry | `src/shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay.js` | Platform branch: Fit on Android, HealthKit on iOS |
| Sync | `stepsSyncService` + `FoodContext` | Diff + persist `users/{uid}.dailySteps` |

Android path in `GoogleFitStepDisplay`:

1. `PermissionsAndroid` activity recognition where needed
2. `GoogleFit.authorize({ scopes: FITNESS_ACTIVITY_READ })`
3. `GoogleFit.getDailyStepCountSamples({ startDate, endDate })`
4. Prefer sources: `estimated_steps`, `merge_step_deltas`, derived step deltas
5. Callbacks: `onStepsUpdate`, `onStepsHistory`, `onConnectedChange`, errors/loading

iOS stays on HealthKit. Do not touch it in the Android migration.

## Recommended target

**Health Connect** via `react-native-health-connect` (matinzd).

Reasons:

- Google’s own migration table maps **mobile step tracking** → Health Connect
- On-device store, one permission surface for Fit, Samsung Health, etc.
- Expo config plugin ships inside the package (no separate `expo-health-connect` for current major)
- minSdk 26 matches a reasonable floor for Health Connect

Not recommended for this app: Google Health API (cloud / account-centric). We only need on-device daily step totals.

## Constraints

- Needs a **dev-client / EAS native rebuild** (not Expo Go)
- Play Console **Health apps declaration** for Health Connect data types (approval can take days)
- Android 14+ ships Health Connect; older devices may need the Health Connect APK from Play
- `targetSdk` / `compileSdk` should be current (library docs show 35–36); align with Expo 54 defaults when adding the plugin
- Permission UX changes: Health Connect system sheet instead of Google Fit OAuth scopes

## Migration steps (implementation order)

### 1. Dependency and config

1. `npm i react-native-health-connect`
2. Keep `react-native-health` for iOS
3. In `app.config.js` plugins:
   - add `react-native-health-connect`
   - ensure `expo-build-properties` android `minSdkVersion >= 26` (and compile/target as required by the lib version you pin)
4. Android permissions in config:
   - `android.permission.health.READ_STEPS`
   - keep `ACTIVITY_RECOGNITION` if still required for any path
5. Remove `./plugins/withGoogleFitVersions` once Fit is gone
6. Remove `react-native-google-fit` from `package.json` and from any Metro exclude lists that only existed for Fit

### 2. Abstraction in JS (keep FoodContext stable)

Split `GoogleFitStepDisplay.js` responsibilities:

| Module | Responsibility |
|---|---|
| `steps/types.ts` | Shared result shape: `{ dateKey: string, steps: number }[]`, connection status |
| `steps/readSteps.ios.ts` | Existing HealthKit logic (move as-is) |
| `steps/readSteps.android.ts` | Health Connect: `initialize` → `requestPermission([{ accessType: 'read', recordType: 'Steps' }])` → `readRecords('Steps', { timeRangeFilter })` or aggregate API → sum by local calendar day |
| `steps/StepDisplay.tsx` | Same ref + callbacks as today; picks platform module |

Do **not** change `FoodContext` callback contracts in the first PR. Rename the component file only after Android is verified.

Aggregate by **local** day boundaries (existing `getLocalISOString` / `formatDate` helpers). Health Connect records are interval-based; sum `count` for records overlapping each local day, same lookback (30 days + small rollover window).

### 3. Permission and availability UX

- `getSdkStatus()`: if `SDK_UNAVAILABLE`, show install/update Health Connect; if `SDK_AVAILABLE`, request read Steps
- Empty grant list → treat as disconnected (same as Fit auth failure today)
- Dashboard / home already has steps permission dismiss state; reuse those keys

### 4. Cut over

1. Feature-flag or Platform branch: build A with Fit, build B with Health Connect, side-by-side on a test device
2. Compare daily totals for the same account over 7+ days (accept small deltas; sources differ)
3. Ship Health Connect; remove Fit dependency and `withGoogleFitVersions`
4. OTA cannot swap native modules — this is always a store build

### 5. Play / policy

- Declare Steps read in Play Console health form
- Privacy policy: state on-device Health Connect read, no sale of health data
- Data safety form: steps collected, shared with Health Connect only as user-mediated

## Out of scope

- Writing steps back to Health Connect
- Heart rate, workouts, weight from Health Connect (app already uses its own weight + workout history)
- Google Health cloud API
- Changing iOS HealthKit

## Risks

| Risk | Mitigation |
|---|---|
| Totals differ vs Fit preferred sources | Document that Health Connect is multi-source aggregate; optional later filter by dataOrigin |
| Users without Health Connect app | Deep link to Play Store listing; graceful “steps unavailable” |
| Permission bugs on Android 14/15/16 | Pin a recent `react-native-health-connect`; test on physical devices before store |
| Time left in 2026 | Prefer shipping before Q4 2026; Fit may die mid-quarter without a single public day |

## Owner decisions

1. Approve Health Connect as the Android steps backend (recommended: yes)
2. Target first Play build that includes HC before **2026-11-01** (buffer before hard end of year)
3. Whether to show a one-time in-app note that Android steps now use Health Connect

## Done when

- Android builds without `react-native-google-fit`
- Steps today + history still fill `dailySteps` and the home/nutrition UI
- iOS path unchanged
- Play health declaration submitted for Steps read
