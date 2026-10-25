# App flow audit handoff

## Nutrition meal-save durability follow-up (2026-10-25)

Confirmed that the meal service wrapped Firestore `setDoc` in a 12-second UI timeout, while `persistOptimisticMealWrite` rolled back local cache/state on any timeout or rejection. Firestore offline writes can remain queued and later sync, so that rollback could leave the visible app and Firestore out of agreement.

The save flow now stores the latest full snapshot per user/date/meal in a versioned AsyncStorage outbox before attempting Firestore. A delayed or rejected Firestore write leaves the meal visible and queued; the queue is removed only after Firestore acknowledges the write. Account initialization overlays queued snapshots over both cached and fetched meals, and starts a background retry without blocking app startup. A neutral authenticated-app banner reports pending meal changes and offers manual retry. Queue persistence failure still rolls back and reports a save failure because the app cannot safely promise durability without a saved outbox entry. The existing account-deletion cleanup removes the outbox key because it is uid-suffixed.

Validation for this follow-up: Jest passed all 165 suites / 1,274 tests; `npx tsc --noEmit` passed; Android `npx expo export --platform android` passed. Jest still prints the repository's existing React `act(...)` and open-handle warnings, but exited successfully. No native rebuild was run; the user asked to defer rebuilds until needed. This change is local and uncommitted unless the user later requests a commit.

Updated 2026-10-17 for the next coding agent. Read `AGENTS.md` before making changes.

## Current state

- The broader app-flow audit is ongoing, not complete. Workout and Progress have prior accumulated audit changes. This pass continued through Nutrition, Auth, Profile, and Dashboard; several confirmed issues were fixed, but the entire app has not been proven bug-free.
- The audit changes from the 2026-10-15 passes are committed on `master` (`5359dca`, `db4d70b`, `7c8a189`, `424aafb`, `71888db`). A follow-up review of those commits is recorded under "Post-commit review" and "Later fixes" below; its fixes are committed on `master` too.
- The workout flow has had a broad review across active workout restore and account switching, set validation and editing, exercise selection and identity, completion and exit, workout history, templates, splits, and navigation.
- The latest follow-up found that template and split update functions accept partial data but wrote every possible field, including fields that were `undefined`. Firestore can reject those updates, and truthy defaults could discard intentional zero values. The update functions now include only supplied fields and preserve explicit zeroes. Template rename inputs are trimmed, and an empty renamed value is rejected.
- Regression coverage for the handler persistence cases is in `src/features/workout/handlers/WorkoutHandler.test.ts`.
- Auth state listener and refresh requests now use a uid/generation guard so an earlier account load cannot replace the current user's context after an account change.
- Profile saves now distinguish a successful Firestore write from a failed profile refresh instead of claiming that the whole save/reload flow completed.
- Dashboard dismissal storage now validates persisted timestamp arrays and ignores stale loads when the authenticated uid changes. A failed workout-schedule fetch displays an unavailable state rather than presenting the failure as a rest day.
- Meal mutations for one user/date/meal are now serialized as complete optimistic-write/rollback transactions. The next mutation reads state only after the previous write either succeeds or rolls back, avoiding stale queued snapshots.
- Nutrition memo comparisons now include the displayed food name/image/icon and the actual `carbohydrates` field, so recent meal cards do not retain stale presentation data.
- The work in this section was committed in the five commits named above. It includes progress changes and tests; do not assume every change belongs only to the last workout follow-up.

## Cross-feature audit pass (2026-10-17)

This pass reviewed the current working tree, including uncommitted changes. The first-party inventory under `src/` contains 278 production TypeScript/JavaScript files (39,228 lines) and 126 test files. Generated native projects, build outputs, assets, and `node_modules` are not application source and were not line-reviewed. The review was broad and subsystem-based; it is not a guarantee that every source line was individually read or that the app is defect-free.

Concrete code-level findings to address or explicitly accept:

| Severity | Finding | Current evidence |
|---|---|---|
| Medium | A delayed active-workout restore may overwrite set edits made while the restore is pending. | `WorkoutService.ts` restore state/generation checks do not invalidate a restore when a local set edit occurs; the auth listener and screen can both initiate restore. |
| Medium | An older workout-schedule fetch can replace the schedule for a newer active split. | `useWorkoutScreenSchedule.ts` applies results from the captured split id without a request-generation/stale-result guard. |
| Medium (known residual) | Anonymous users can insert fabricated entries into the shared barcode catalog. | `supabase/rls.sql` intentionally permits bounded `anon` inserts; this can poison barcode lookup results for all users. The deployed policy state was not checked in this pass. This is a known owner-accepted tradeoff, not a newly discovered configuration state. |
| Low | Dashboard workout and weekly overview date calculations can remain stale after the app stays open across local midnight. | `useDashboardScheduledWorkout.ts` and `WeeklyOverview.tsx` recalculate on focus/dependencies, not on a day-boundary event. |
| Low | Progress adherence may continue using the previous split's weekly target after changing splits if the replacement fetch fails. | `usePlannedWorkouts.ts` retains the prior value; its test currently asserts that behavior. Confirm whether stale-while-revalidate is intentional or whether the UI should indicate that the current target is unavailable. |
| Low | Custom-food unit control appears interactive but has no press handler. | `CustomFoodScreen.tsx` renders the unit control without wiring the `changeUnit` function exposed by `useCustomFood.ts`. |
| Low (conditional) | Selecting same-named but distinct food records can toggle the wrong selected item. | `FoodSelectionScreen.tsx` uses `productName` as selection identity. Impact depends on whether duplicate names exist in the live catalog. |

The reviewers reported no additional concrete findings in Auth/Profile or in the already tested Workout Details/Create Template helper boundaries. Findings above were code-path reviews; UI timing and live data cases were not reproduced on a device/backend. No code fixes were made as part of this audit request.

### Second review and revalidation (2026-10-17)

Run on `origin/master` at `5be358b` with a clean install. Baseline: `tsc` clean; Jest 126 suites / 1,044 tests in UTC, America/Los_Angeles and Europe/Bucharest; `npx expo install --check` passed; Android bundle export passed in production and `--dev` mode. Secrets pattern scan of the tree and of all 385 commits found nothing. `firebase/`, `supabase/rls.sql`, `eas.json` and the three workflows were re-read; the rules have not changed since `71a800a`. The Firebase emulator tests could not run in this review environment.

Revalidated against current code and still present: the custom-food unit control has no `onPress` (`CustomFoodScreen.tsx` line 179), `FoodSelectionScreen.tsx` still keys selection by `productName` (lines 98, 145 to 147), and `useWorkoutScreenSchedule.ts` has no stale-result guard around the async `loadActiveSplit`. The `AuthContext` and `useFoodSearch` and `useWeightData` leads from the first-pass review were checked only for `AuthContext` (below).

New findings:

| Severity | Finding | Evidence | Status |
|---|---|---|---|
| Medium | Decimal commas were mangled in the custom-food form (`12,5` became `125`) and read as `1` in the serving-size input (`parseFloat('1,5')`). Silent wrong data for anyone whose numeric keyboard shows a comma. | `useCustomFood.ts` stripped everything except digits and points; `ServingSizeSelector.tsx` parsed the raw text. An existing test asserted `'1,25g'` becomes `'125'`. The weight entry uses an in-app keypad and is not affected. | Fixed: `utils/decimalInput.ts`, both inputs, tests added, the characterization test updated. Not tried on a device keyboard. |
| Medium | After a dependency bump the committed `package-lock.json` has `expo-modules-core` 3.0.30 (was 3.0.21) and `expo` 54.0.37 (was 54.0.13), but `runtimeVersion` is `{ policy: "appVersion" }` and the version is still `2.0.5`. An OTA update published from this tree would be delivered to older binaries built with the previous native module. A dev client built before the bump does not match the current JS. | `package.json`, `package-lock.json`, `app.config.js`. | Updated after this audit checkpoint: `runtimeVersion` now uses the `fingerprint` policy, so old `2.0.5` binaries are isolated from updates with a different native fingerprint. Before publishing, generate/compare fingerprints in the same environment as the native build; the Google services file is a fingerprint input. No update workflow exists in the repo. |
| Low | `AuthContext` sets `loading` to `true` on every auth event, and `App.tsx` swaps the whole navigator for the splash stack while it is true. The login and registration screens therefore unmount and remount during sign-in and sign-up, including the intermediate unverified-user event. | `AuthContext.tsx` lines 94 to 120, `App.tsx` lines 83 to 90. | Open. Likely effect: typed fields reset and a visible flash after an unverified sign-in. Not observed on a device. |
| Low | Weekly and completion counts now exclude workouts whose timestamp is later than the device clock (`<= now`). History timestamps are Firestore server times, so a device clock that runs behind hides a just-finished workout until the clock catches up. | `workoutHistory.ts`, `dashboardWorkoutSummary.ts`, `workoutHistorySummary.ts` (commits `cabacfa`, `8cbd45f`). History cannot contain future workouts through the app, so the guard protects against no known case. | Open. Consider a tolerance of a few minutes, or reverting. Not reproduced. |
| Low | `updateSplitInFirestore` writes the schedule without the sanitizer that `addSplitToFirestore` uses, so edited splits keep hydrated template fields and could carry `undefined` for legacy data, which Firestore rejects. | `workoutSplitService.ts`, `CreateSplitScreen.tsx` line 216. | Open, low likelihood. |
| Low | The Maestro install step runs `curl ... | bash` from an unpinned URL, and actions are pinned by tag, not commit SHA. `eas-cli` is pinned. The workflows have read-only `contents` permission and are manual with a confirmation input. | `android-ui-smoke.yml`, `tests.yml`. | Open, accepted risk for a manual workflow; pin when convenient. |
| Info | `AsyncStorage` key `auth_token` stores the user's uid, is written and removed in `AuthContext` and never read. | `git grep auth_token`. | Misleading name, no security effect; remove when touching the file. |
| Info | `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are now blocked in `app.config.js`. The Play readiness doc argues the app does not need them. | `app.config.js`, `docs/PLAY_STORE_RELEASE_READINESS.md`. | Needs the profile picture and workout photo pickers checked on an Android 11 to 13 device. |

The dependency numbers in `docs/PLAY_STORE_RELEASE_READINESS.md` (65 and 91 advisories) are from 2026-10-16 and are stale; the current production audit is 28 (22 high, 6 moderate, 0 critical), all in the Expo CLI, Metro, Jest and React Native tooling chains. They were not shown to be reachable from app code, and not proven unreachable either.

### Verification and release boundary

- Local Jest: 126 suites / 1,044 tests passed in UTC, America/Los_Angeles, and Europe/Bucharest.
- TypeScript: `npx tsc --noEmit` passed. The project has strict TypeScript enabled, but Firestore converters still trust persisted records via casts and some route payloads remain `unknown`; this is a runtime-validation/type-model limitation, not a current compiler error.
- Firebase: `npm run test:rules` passed all 8 local Firestore/Storage emulator tests.
- Expo: `npx expo install --check` and Android JS bundle export passed; filtered config introspection showed the expected package IDs, backup setting, API permission declarations, and HealthKit usage descriptions.
- Current Jest coverage: 49.88% lines, 41.63% branches, 43.73% functions, 49.80% statements. CI does not enforce a coverage threshold.
- Production dependency audit: 28 advisories remain (22 high, 6 moderate), reported through transitive `braces`, `node-forge`, and `sprintf-js` paths. The offered fixes require breaking Expo/Jest/React Native upgrades; do not force-upgrade outside an aligned SDK update.
- GitHub Actions for commit `e2fb3a2` on `master` passed. That run validates the committed base only, not this dirty working tree.
- Not verified: a fresh signed Android AAB/native build, any iOS build, physical-device or Play internal-track behavior, HealthKit/Health Connect and camera permission journeys, screen reader/accessibility behavior, live Supabase RLS, deployed Firebase/Supabase console state, and Play Console declarations. Use the owner checklist below and `docs/PLAY_STORE_RELEASE_READINESS.md`.

### Follow-up audit and verification (2026-10-18; HEAD `3d584e3`)

The cross-feature review has **not** read every source line individually. The tracked `src/` inventory is 278 production TypeScript/JavaScript files (approximately 39,228 lines) plus 126 test files. Reviewers covered principal flows, but their own coverage accounting confirms partial, not line-by-line, review: Auth/Profile 33 tracked production files (~4,150 lines), Workout 115 (~17,231), Nutrition 75 (~11,549), Dashboard/Progress 13 (~3,585). Shared-platform review initially targeted a different repository and covered zero files there; a selection of shared files was inspected directly afterward, not the whole shared tree. Generated native projects, assets, dependencies, and most test sources were not line-reviewed.

New code-level findings from this follow-up:

| Severity | Finding | Current evidence |
|---|---|---|
| Medium | Deleting an active split after an account switch can clear the new account's active-split setting. | The deletion callback closes over the old split/user state, but `handleSplitDeleted` reads `getAuth().currentUser.uid` only after the async delete completes (`WorkoutLibraryScreen.tsx`). |
| Low | Imperial height conversion can render 12 inches instead of carrying into feet. | `convertCmToFtIn` rounds the inch remainder without normalizing a result of 12 (`buildOnboardingStepContent.tsx`); 182 cm yields 5 ft 12 in, and the controls clamp the inches to 11 on the next edit. |
| Low | Weight-goal progress counts movement away from the goal as progress. | `WeightTracker.tsx` uses the absolute distance from the starting weight; for a 70 kg start and 60 kg goal, 80 kg produces 100%. |
| Low | “New Meal” opens single-food creation rather than a meal-combination flow. | `AddFoodMenu.tsx` labels the option “meal combination”, but routes to `CustomFood`; `useCustomFood.ts` submits one food to `FoodDetail`. |
| Low | A held weight-adjustment button can leave an interval running if the component unmounts before release. | `WeightTracker.tsx` clears the interval only in `stopLongPress`; there is no unmount cleanup. |
| Low | A native camera-permission rejection can leave barcode scanner permission state unset and become an unhandled promise rejection. | `BarcodeScannerScreen.tsx` awaits permission calls without a catch; the mount-time async function is launched without handling its rejection. |

The Metro concern raised by the earlier reviewer is **not a confirmed finding at this HEAD**: both `patches/@expo+metro++metro+0.83.3.patch` and `patches/metro+0.83.1.patch` are tracked, and `postinstall` runs `patch-package`. The raw `image-size` API does reject a filename and accepts a buffer, but the tracked Metro patches adapt those calls. A fresh CI/EAS export was not run in this follow-up.

### Tool-driven whole-tree scan (reported 2026-10-17)

A supplementary scan report was supplied during this audit. It says all 280 `.ts`/`.tsx` files were checked with type-aware ESLint rules for floating/misused promises, React hooks, and basic correctness, and an import-cycle/orphan scan covered 408 files. The report also describes unused-export/dependency scans, a `patch-package` check, and inspection of standalone scripts. I did not independently rerun these tools in this follow-up. This gives broad static-tool coverage, not manual line-by-line review or runtime verification.

| Scan result | Reported outcome |
|---|---|
| Circular imports / orphan source files | None reported. |
| Floating promises (39) | 33 calls were reported to catch their own errors. Remaining native calls include camera permission, settings, and haptics; the camera-permission rejection risk is listed above. |
| Misused promises (55) | Async handlers passed to void-typed props; not triaged individually, so this remains an open review area rather than 55 confirmed defects. |
| React hooks warnings (45) | Mostly stable animation values/refs; three inspected closure warnings were reported benign. The existing `AGENTS.md` count of 38 is stale. |
| Timers/listeners | Cleanup was reported except for the WeightTracker press-and-hold interval, listed above. |
| `patch-package` | All three tracked Metro/React Native patches were reported to apply; they are tied to exact dependency versions and should be rechecked on upgrades. |
| Unused exports / dependencies | 17 exports with no references and 39 referenced only by tests were reported, along with six unused dependencies (`react-redux`, `react-native-toast-message`, `react-native-chart-kit`, `react-native-vector-icons`, `@welldone-software/why-did-you-render`, `dotenv-cli`). These are maintenance candidates, not runtime defects; no removal was made. |
| Standalone scripts / external URLs | Migration script is reported dry-run unless `--apply`; RLS verification reads keys from the environment. Only the Expo Updates URL was reported hardcoded. |

The scan does not cover runtime behavior, layout, native code, backend state, or logic errors that no rule detects. `knip` reportedly ran out of memory and was replaced with a small usage scan. Treat the 55 untriaged async handlers and device/backend checklist as remaining work.

The findings listed as open at this audit checkpoint were subsequently addressed in the working tree as recorded below. The shared barcode-catalog insert policy remains an owner-accepted risk. The later `updateSplitInFirestore` sanitizer and app-version/runtime-version compatibility concerns were also addressed in the working tree.

Verification at `3d584e3`: `npx tsc --noEmit` passed; the full Jest run passed **128 suites / 1,052 tests** in the default timezone; Android `npx expo export --platform android` passed; `npm audit --omit=dev` reported **28 advisories (22 high, 6 moderate)** and exited non-zero. The raw Metro `image-size` API behavior was reproduced, and tracked patches were confirmed to adapt it. Multi-timezone Jest and Firebase emulator tests were not rerun at this revision. The export is JS bundling only; no native build or device/backend validation was done. No code fixes were made as part of this audit request.

### Fixes included in commit `7a81fd6` (2026-10-18)

The following confirmed code-level findings have been fixed with regression coverage in the current, uncommitted working tree:

- Active-workout restore now invalidates an in-flight storage read when a local mutation occurs.
- Workout schedule fetches use a request generation guard; stale responses are ignored and a missing active split clears the displayed schedule.
- Progress clears the prior split's weekly target when the selected split changes, including when the next request fails.
- Active split deletion carries the deleting user's UID through the async operation and avoids clearing persisted state after an account switch. Split update data is sanitized before Firestore writes.
- Imperial height conversion rounds total inches before splitting feet/inches; weight-goal progress reflects movement toward rather than away from the goal.
- The custom-food unit selector now opens unit choices; “Combine Foods” routes to the existing multi-food selection flow; food-selection identity prefers item IDs and falls back to food attributes.
- Barcode permission failures are logged and surfaced to the user; settings-open failures are caught. WeightTracker press-and-hold timers are cleared on unmount.
- Dashboard date-dependent workout summaries update at local midnight and when the app resumes. Haptic rejections are logged through shared feedback helpers.
- Workout-history summaries allow up to five minutes of server/device clock skew while continuing to ignore substantially future-dated records.
- Repeated Auth events for the same UID no longer reset auth/loading state and remount the login/registration flow; a changed UID still clears prior account state while the new profile loads.
- Expo `runtimeVersion` now uses the `fingerprint` policy to prevent incompatible OTA delivery across native dependency changes. A compatible native build is still required before distribution.
- Jest now includes `src/shared/hooks` tests, and `AGENTS.md` reflects the reported patch-package and hooks-warning baselines.

This does not resolve the anonymous barcode-catalog insert policy, triage the 55 reported async-handler warnings, or establish device/backend behavior. The fingerprint runtime policy has only had Expo config resolution checked so far; it does not replace a native build or release/device verification.

Validation for commit `7a81fd6`: `npx tsc --noEmit` passed; `npx jest --runInBand` passed **133 suites / 1,067 tests**; the focused clock-skew tests passed in the default timezone and `America/Los_Angeles`; Android `npx expo export --platform android` passed; Expo config resolved `runtimeVersion` to `{ "policy": "fingerprint" }`; and `git diff --check` passed. This is JS bundle and unit-test verification only, not a native build, device run, Firebase emulator run, or live-backend/RLS verification.

### Independent review follow-up (after `7a81fd6`; working tree)

An independent review identified two confirmed `WorkoutService` regressions, a missing Dashboard midnight dependency, and an id-less food edit identity gap. Follow-up changes now:

- Increment the workout-data generation only for real workout-data/session mutations, not persistence scheduling or note writes. A note update no longer cancels a pending template load, and overlapping restore reads can both resolve without invalidating each other.
- Recompute Dashboard weekly/today summaries on local-day changes and test the Sunday-to-Monday transition. Weekly counts are bounded to the Monday-through-Monday interval so a timestamp within the clock-skew tolerance cannot pull next week's workout into the prior week.
- Assign a stable ID before opening FoodDetail for an id-less selection, pass it through the detail route, and upsert the returned edited item instead of appending a duplicate.
- Use one shared local-date-key formatter for the midnight invalidation token and Nutrition's persisted local date keys.

The review also confirmed the fingerprint policy's environment-sensitive constraint: `googleServicesFile` content contributes to the Android fingerprint. Do not publish an update from an environment missing or using a different Google services file than the target native build. This repository has no EAS Update workflow to enforce that precondition; fingerprint/build matching remains a release-process check, not a passing unit test.

Follow-up validation after these independent-review fixes: `npx tsc --noEmit` passed; the full Jest run passed **134 suites / 1,073 tests**; five focused date suites passed **21 tests** in `America/Los_Angeles`; Android `npx expo export --platform android` passed; and `git diff --check` passed. Native build, device, Firebase emulator, live backend/RLS, and EAS Update fingerprint equivalence remain unverified.

## Main fixes and rationale

- Active workouts are isolated by user in `WorkoutService`; user changes reset in-memory workout state and remove the legacy device-wide key. This prevents one account's unfinished workout being resumed or saved under another account.
- Set edits clear validation when weight or reps actually change. Unchanged inputs retain their validation state.
- Workout completion snapshots service state before awaiting Firestore, and completion/exit paths guard against stale account state.
- Exercise identity and picker behavior prevent duplicate additions and support replacing an exercise.
- Split schedule handling restores template IDs for assignment, handles null/rest days safely, distinguishes rest days from assigned workouts, and supports rotation scheduling. Activation/deletion and preview paths received consistency fixes.
- Exercise history errors are surfaced with retry rather than appearing as empty history; stale asynchronous loads are guarded.
- Duplicate template names are normalized case-insensitively, including rename and concurrent creation.
- Related pure logic and service/handler tests cover schedule calculations, exercise identity/history, metrics, set validation, active split deletion, timer behavior, workout persistence, and the handler cases.

For exact local changes, inspect `git status --short` and `git diff` before editing. Notable files include:

- `src/features/workout/services/WorkoutService.ts`
- `src/features/workout/handlers/WorkoutHandler.ts`
- `src/features/workout/screens/StartWorkoutScreen/StartWorkout.tsx`
- `src/features/workout/screens/CreateSplitScreen/CreateSplitScreen.tsx`
- `src/features/workout/screens/WorkoutLibraryScreen/WorkoutLibraryScreen.tsx`
- `src/features/workout/context/WorkoutContext.tsx`
- `jest.config.js`

## Current module: Nutrition

The current Nutrition pass has confirmed and addressed these issues:

- Date-only keys (`YYYY-MM-DD`) were parsed through JavaScript's UTC date-only behavior in multiple paths, shifting calendar days for users outside UTC. `dateUtils.ts` now provides local date parsing/formatting and local calendar-day differences. Meal cache ranges, weight week calculations, weight display/trend keys, the weight chart, and food/date screens now use those helpers rather than UTC serialization/parsing.
- Failed meal edits could look successful because the edit helper swallowed the persistence error. The helper now reports failure and the UI does not proceed as if the save succeeded.
- Async Nutrition work could finish after the authenticated account changed and write stale data into the new user's provider state. The provider now guards account/generation-sensitive asynchronous results and resets user-scoped in-memory state on UID changes.
- A pending food search could repopulate results after the query was cleared or shortened. Query changes invalidate pending results, and failed searches now have a visible error/retry state distinct from an empty result.
- Persisted meal caches are checked for valid shape and TTL before use; invalid, expired, or future-dated cache wrappers fall back to Firestore, with cache storage failures logged.
- Barcode lookups reject overlapping scan events, step history writes requeue failed values without discarding newer pending values, and the food-selection screen navigates only after its meal save succeeds.
- Queued meal writes now calculate and persist each mutation inside the serialized operation, and perform rollback before releasing the queue to the next mutation.
- Recent-meal memo comparators include all food presentation fields used by `FoodItem`, including `productName`, `image`, `icon`, and `carbohydrates`.
- Failed reads for a newly selected Nutrition date now show an explicit alert instead of leaving an apparently empty meal list. Completion and error callbacks are ignored if the user or selected date changed while the request was pending.
- Firestore meal reads now discard null or malformed entries before they reach meal-list state or the recent-meal cache; daily totals also ignore null or undefined entries and treat missing or non-numeric nutrient values as zero.
- Weight data cache entries with future timestamps are now treated as stale and reloaded from Firestore; focused service tests also cover memory/persistent cache hits, stale cache fallback, missing documents, and selected-week display data.
- If the initial meal load fails without usable cached data, Nutrition now presents a retry action instead of leaving the screen on an indefinite loading indicator.
- App-start weekly evaluation now requires a nutrition snapshot newer than `lastEvaluatedWeek`; successful evaluations and maintenance-only refreshes persist the latest evaluated week. Older accounts with an adjustment date but no marker are left to the weigh-in evaluation path. Regression tests cover stale snapshots, newer snapshots, legacy markerless accounts, and first-time evaluation.
- Focused regression tests cover date helpers and DST, meal-cache ranges/storage, request generations, selected-date read success/failure and stale-result guards, malformed Firestore meal records across current-day, raw-day, and recent-meal reads, null-safe daily totals, weekly evaluation snapshot guards, Supabase filters/search fallbacks/errors, failed edits, serialized meal mutations, barcode guards, step retries, numeric validators, memo comparisons, and weight cache/week display behavior.

This pass is **not a claim that all Nutrition defects are fixed**. Remaining work:

1. Continue tracing all remaining Nutrition flows, especially account/cache transitions. The app-start weekly evaluation's stale-snapshot guard has been confirmed in code and tests; verify its first release/device behavior separately.
2. The serving-unit conversion behavior is a product decision. Do not change it without the owner confirming the intended amount/nutrient scaling.
3. Reconfirm outstanding audit-plan candidates against current code before acting; the plan predates some fixes and contains stale file names/line numbers.
4. Continue reviewing other flows not covered in this pass and add focused tests for confirmed defects.

Known test limitation: Jest has no component/navigation harness. The new tests verify pure utilities and service/helper behavior, not end-to-end screen interactions on a device. The new initial-load retry UI needs a device check. Test device-only flows separately.

## Post-commit review (2026-10-15)

Reviewed the five commits from today against current code. Baseline before edits: `npx tsc --noEmit` clean; `npx jest --runInBand` 48 suites / 565 tests, also in `TZ=America/Los_Angeles`; `git diff --check` clean.

Confirmed and fixed:

- `addTemplateToFirestore` used a deterministic document id derived from the template name. Template ids do not change on rename, so after renaming "Push" to "Pull", creating a new "Push" hit the old document and failed with a false "name already exists" error. When the existing document has a different name, the template is now created under an auto-generated id; same-name collisions still throw. Test: `creates a template under a new id when the deterministic id belongs to a renamed template` in `WorkoutHandler.test.ts` (fails on the previous handler, passes now); the concurrent-creation test now supplies the existing document's name.
- `ProfileScreen` returned early when the profile refresh failed after a successful write, without updating local saved state. Tapping Save again re-ran the whole save: a second email-verification request, a second picture upload and a repeated plan update. Local saved state is now updated once the write succeeds, and the alert no longer tells the user to tap Save again. Code-reviewed and type-checked only: there is no component harness.

Reviewed with no defect found: auth generation guards, dashboard dismissal parsing and load-error state, meal mutation queue and rollback, meal cache validation, date helpers, weight chart/tracker date keys, `useWeightData` request tracking, food search request tracking, step flush retry, workout service persistence queue, set validation, PR calculation, exercise identity and history, split schedule helpers, template and split update payloads.

Not verified: all screen behavior on a device; `fetchSplitsFromFirestore` enrichment against real legacy documents; Firestore rules for the new auto-id fallback path.

Validation after the fixes: `npx tsc --noEmit` clean; `npx jest --runInBand` 48 suites / 566 tests, default timezone and `America/Los_Angeles`; `git diff --check` clean; `npx expo export --platform android` succeeded (temporary output removed).

## Later fixes (2026-10-15 to 2026-10-16)

Committed on `master`, in order:

- Template names are reserved per user in `users/{uid}.workoutTemplateNames`, kept in one transaction on create, rename and delete (`Reserve template names per user`).
- When the deterministic template id belongs to a renamed template, the new template gets the id `<autoId>_<uid>`, because the Firestore create rule for `workoutTemplates` requires ids ending in `_<uid>` (`Make the renamed-template fallback id satisfy Firestore rules`).
- Macro bars show no progress when there is no target. The estimate path was removed.
- `getWeightDisplayData` propagates read failures. Before, `useWeightData` cached an empty summary as real data. The hook already catches and retries.

Security pass fixes, handed over as patches and applied by the owner:

- Template creation no longer reads the template document inside its transaction. The deployed rule `allow read: if ownsDoc()` reads `resource.data.uid`, and `resource` is null for a document that does not exist, so the read was denied and creating any template with a free id probably failed. The taken-id check now uses the user's template list and the name registry. Found by comparing the rules with the code; it was not observed on a device or in the emulator.
- `android.allowBackup` is false. The manifest had it enabled, so backups could copy AsyncStorage, which holds the Firebase refresh token and cached profile and meal data.
- `android.permission.RECORD_AUDIO` is blocked. The app never records audio.
- Google sign-in no longer fails for a returning user whose Google profile has no name or photo while the stored profile lacks them. `updateDoc` was given `undefined` values, which Firestore rejects.

## Security pass (2026-10-16)

Inspected, no defect found:

- Secrets: the working tree and all 285 commits were scanned for Google API keys, JWTs, private keys, cloud and GitHub tokens, and for committed env, keystore and credential files. Nothing matched. `eas.json` holds only `${VAR}` placeholders. This is a pattern scan, not proof; the SEC-01 key was never committed and was rotated.
- Logging: no console call prints tokens, emails or profile data. Errors are logged with their message.
- Deep links: the scheme is registered and the main activity is exported for it, but there is no `linking` configuration, so nothing routes from a URL.
- AsyncStorage: per-user keys carry the uid, device-wide caches are cleared on sign-out, the shared exercise catalog cache never holds custom exercises, and account deletion removes every key ending in the uid.
- Auth: unverified password accounts are signed out by the services and treated as signed out by the listener. Password reset treats `auth/user-not-found` as success. Sign-up reveals `auth/email-already-in-use`; I believe the enumeration-protection setting does not hide that, but this was not checked.
- Firestore and Storage rules against every read and write in the code: one mismatch (template creation, above). `meals`, `users` and `exercises` allow reading a missing document; the other user-data collections do not.
- Generated Android main manifest (`expo prebuild` in a scratch copy, not a build; library manifests merged at build time were not inspected): permissions are CAMERA, INTERNET, READ_EXTERNAL_STORAGE, RECORD_AUDIO (now blocked), SYSTEM_ALERT_WINDOW, VIBRATE, WRITE_EXTERNAL_STORAGE and READ_STEPS.

Recommendations, not applied (owner decides, and deploys any rule or SQL):

1. The rules do not check email verification. The verification gate is client-side, so an unverified password account that keeps a session can use Firestore and Storage for its own documents. Enforcing it means `request.auth.token.email_verified` in `signedIn()` and a change to sign-up, which writes `users/{uid}` before the address is verified.
2. `users/{uid}` has no field allow-list. Only the owner can read or write the document, so the impact is limited to their own data. No change recommended.
3. Supabase sees every client as `anon`, because the app signs in with Firebase. Anyone with the public anon key can insert `barcoded_products` rows for barcodes not yet present. The policy bounds only the barcode format, the name length and non-negative macros; other columns such as `image` have no checks and there are no upper bounds or rate limits. Options: add upper bounds and length checks, or move inserts behind a function that verifies the Firebase ID token.
4. SYSTEM_ALERT_WINDOW, READ_EXTERNAL_STORAGE and WRITE_EXTERNAL_STORAGE appear in the generated main manifest and nothing in `src` obviously needs them. `WorkoutDetails.tsx` calls `requestMediaLibraryPermissionsAsync`, which probably needs READ_EXTERNAL_STORAGE; test on a device before blocking any of them.
5. EAS Update runs without code signing, so the Expo account is the trust root. Keep two-factor on the Expo and GitHub accounts.

Not verified: everything above that needs a device, a build, the Firebase or Supabase consoles, or the Firestore emulator (not reachable from the sandbox). `fetchSplitsFromFirestore` orders by `createdAt`, which silently excludes any legacy split document without that field; check the console.

Resolved open questions: `selectedDate` cannot be undefined in `handleFoodAddition`, because `FoodDetailScreen` normalizes the route param to a local `Date` (today when missing) before calling it.

## Decisions

- Weekly evaluation: keep the app-start trigger with the new-snapshot guard (`lastEvaluatedWeek`). Do not change its timing without the owner.
- Macro bars: no target means no progress is shown.
- Maintenance-goal UI (`docs/future-maintenance-goal-support.md`): do not implement.
- SEC-12 dependencies: do not run `npm audit fix --force`; it proposes downgrades such as Expo 44 and Firebase 9. A plain `npm audit fix` does not clear the findings. Revisit at the next Expo SDK upgrade.
- Serving-unit conversion semantics: do not change without the owner.

## Template registry caveats

- A template deleted outside `deleteTemplateFromFirestore` (the Firebase console, a future bulk delete) leaves a stale name reservation that blocks that name. In the code, the only other path that deletes templates is account deletion, which also deletes the whole `users/{uid}` document, so it is not affected.
- Legacy templates have no registry entry. The duplicate-name query still catches them.
- Deleting or renaming a template that was already deleted elsewhere is expected to fail with permission denied, because the transaction reads the missing document. Not observed.

## Owner checklist

Only the owner can do these:

- Create a brand-new template on a device, then rename it and create another with the old name.
- Android and iOS builds, and HealthKit steps on iOS. After the Android config changes, confirm the build installs and the barcode scanner and profile picture picker still work.
- Device checks: Create Custom Food on an empty search, the active-split preview, recent-search Clear and remove, the weekly evaluation at cold start.
- Firebase Auth email-enumeration protection setting.
- Restrict the Firebase web API key in Google Cloud (Android package and SHA-1, iOS bundle id).
- Check in the Firebase console that no split document lacks `createdAt`.
- Deploy any rule or run any SQL recommended above, after checking it with the agent.

## Verification

Latest run (2026-10-16, after the security pass fixes): `npx tsc --noEmit` clean; `npx jest --runInBand` 48 suites / 570 tests, in the default timezone and in `America/Los_Angeles`; `git diff --check` clean.

Workout baseline at the prior handoff was fully validated: **36 suites, 530 tests**, `npx tsc --noEmit`, Android Expo bundle export, and `git diff --check` passed. The blank-template-name regression was added after an earlier type-check/export run; it was covered by the targeted and full Jest reruns, and the diff check passed afterward.

After the 2026-10-16 Nutrition follow-up, the full configured Jest suite passed in the default timezone and in `America/Los_Angeles`: **50 suites, 577 tests** in each run. `npx tsc --noEmit`, Android Expo bundle export, and `git diff --check` also passed. This validates the current changes, but it does not complete the broader app-flow review.

There is no component or navigation test harness. The test results establish service, handler, and utility behavior, not actual screen interactions on a device. Native builds and device-only behavior were not exercised here.

## Audit sequence after Nutrition

Continue through any remaining Nutrition and cross-module flows, then revisit all areas as needed. Profile, Auth, Dashboard, Progress, and Workout have received code-level passes, but none have device-level end-to-end coverage. For each module:

1. Trace the complete user journey through the module, from entry/navigation through state changes, persistence, and error recovery.
2. Follow writes through the relevant context, service/cache, and persistence layer. Verify rollback/error behavior and user-scoped state.
3. Check malformed, boundary, empty, stale-request, and account-switch cases. Respect repository date, auth, and data-ownership conventions.
4. For every confirmed defect, add a focused test in a directory included by `jest.config.js`; add the directory if necessary. Keep changes scoped to one behavior at a time.
5. Validate with focused Jest first, then the full Jest suite, `npx tsc --noEmit`, Android Expo export for screen/import changes, and `git diff --check`. For date logic, also run tests with `TZ=America/Los_Angeles`.

The audit plan's Nutrition candidates include unit changes, macro bars without targets, meal-item memoization, and dead code. Macro bars and memoization have already been addressed in current code; reconfirm all candidates against the implementation. Do not implement behavior that needs a product decision without asking the owner.

## Handoff guardrails

- Do not push or open pull requests. Work in a sandbox clone and hand the owner numbered patches (`git format-patch`, applied with `git am`), one commit per logical change.
- Never print environment values or secrets.
- Keep fixes surgical, follow `AGENTS.md`, and avoid treating UI paths as tested when only unit tests and bundle export have run.
- The next agent should report confirmed fixes, exact validation results, unverified device scenarios, and remaining product decisions.

## Audit checkpoint (2026-10-24)

After `71f729f` (`Update nutrition UI and food search`) reached `origin/master`, a follow-up code review of the Nutrition food-search flow confirmed two defects:

- Recent-search rows used a `TouchableOpacity` around another `TouchableOpacity`. The row and its remove action are now sibling controls, each with an accessible label; the Clear action also has a label.
- Selecting a recent search dispatched the search both from `FoodListItem` and its parent screen. When the parent callback is supplied, the child now delegates only to that callback; its local fallback remains for standalone use.

The fixes and focused regressions are currently uncommitted in `FoodSearchResults.tsx`, `FoodListItem.tsx`, and their component tests. The first full run exposed stale tests for the pushed two-character search minimum, selection accessibility labels, and the meal total; those expectations now match the current UI. Final validation: Jest **158 suites / 1,250 tests passed** (`--forceExit`, needed because existing async handles keep Jest alive); `npx tsc --noEmit` passed; Android Expo export passed with a 9.49 MB Hermes bundle; `git diff --check` passed. The documented scratch hooks scan reported 50 existing exhaustive-deps warnings and its known config error for the unavailable `@typescript-eslint/no-explicit-any` rule; there were no hook warnings in the changed implementation files.

Recent-search interactions still need a device check, including that tapping remove does not launch the search. This checkpoint does not complete the broader app-flow audit; FUP-005, FUP-007, FUP-009 and the owner/device checks above remain open or intentionally unverified.

### FUP-007 recheck (2026-10-24)

Ran `npx jest --detectOpenHandles --runInBand --silent` for `LoginScreen.test.tsx` and `RegistrationScreen.test.tsx`: **2 suites / 18 tests passed**, with no open-handle report. The Login suite took about 49 seconds, but the previously noted individual 5-second test timeouts did not recur. Treat FUP-007 as not reproduced in this run; continue monitoring CI under load instead of changing test timeouts without evidence.

### Nutrition and Food Selection follow-up (2026-10-25)

Rechecked the currently requested summary and food-selection states before the production build:

- The Nutrition steps widget showed `0` before the goal but kept the red icon after reaching 10,000; its reached-state icon is now green. The `10,000 goal` label remains visible in both states.
- Food Selection capped its bar at full but also displayed `100%` above target. It now keeps the visual fill capped and replaces that misleading percentage with a concise remaining/over/on-target status. The current-versus-target calorie figure remains visible.
- Food Selection now shows a compact C/P/F daily balance row based on current totals plus selected foods, so users can see macro room while choosing foods.
- Positive macro values below 0.5 g were rounded to a `0` chip because the render condition used the raw value while the label used rounded values. Such values now display as `<1`; true zeros and missing fields remain omitted.
- The Food Selection title now names the meal being added to when that route parameter is available.
- `MealContainer` renders the meal-total row for every non-empty meal. The reported Snacks discrepancy is not present in the current code. Macro bars remain capped at the target; the actual/target values already show over-target amounts, so no over-warning color or extra percentage label was added.

Validation on 2026-10-25: focused Jest **3 suites / 14 tests passed**; full Jest **161 suites / 1,267 tests passed** (`--runInBand --ci --forceExit --silent`); `tsc --noEmit` passed; Android Expo export passed with a **9.5 MB Hermes bundle**. These checks do not replace a physical-device review. Device checks for the changed Nutrition and Food Selection states and the previously listed Play release blockers remain outstanding. The owner’s uncommitted `app.config.js` version/runtime change was preserved.

### App bootstrap resilience follow-up (2026-10-25)

Reproduced the open REV-003 failure path in the current code: Firebase and Supabase configuration modules threw during static import, before `App` could render. The Expo entry now validates required public runtime config before lazily loading the configured app tree. Missing values produce a plain recovery screen without evaluating Firebase/Supabase-backed modules. Added pure validation tests and a bootstrap regression that deliberately fails if the configured app module loads without config.

The Expo root and Android window background are set to UpTrack's `#0A0E13` so Android edge-to-edge navigation surfaces do not expose Expo's default white root background. This native configuration needs a new development binary to take effect; no native build was started.

Validation on 2026-10-25: focused Jest **2 suites / 4 tests passed**; full Jest **163 suites / 1,271 tests passed**; `npx tsc --noEmit` passed; Android Expo export passed with a **9.5 MB Hermes bundle**; `git diff --check` passed. Expo export verifies JavaScript bundling only. The bootstrap screen and Android system-bar appearance still need device review.
