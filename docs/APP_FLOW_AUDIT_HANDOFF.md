# App flow audit handoff

Updated 2026-10-16 for the next coding agent. Read `AGENTS.md` before making changes.

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
- Focused regression tests cover date helpers and DST, meal-cache ranges/storage, request generations, selected-date read success/failure and stale-result guards, failed edits, serialized meal mutations, barcode guards, step retries, numeric validators, memo comparisons, and weight week/display date behavior.

This pass is **not a claim that all Nutrition defects are fixed**. Remaining work:

1. Continue tracing all remaining Nutrition flows, especially daily totals, account/cache transitions, and the weekly evaluation. Read `audit/PLAN.md` before changing evaluation timing.
2. The serving-unit conversion behavior is a product decision. Do not change it without the owner confirming the intended amount/nutrient scaling.
3. Reconfirm outstanding audit-plan candidates against current code before acting; the plan predates some fixes and contains stale file names/line numbers.
4. Continue reviewing other flows not covered in this pass and add focused tests for confirmed defects.

Known test limitation: Jest has no component/navigation harness. The new tests verify pure utilities and service/helper behavior, not end-to-end screen interactions on a device. Test device-only flows separately.

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
