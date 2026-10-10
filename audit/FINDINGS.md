# Audit findings

Audit of `master` at `fad590d`, done on 2026-10-10 in two passes. All fixes are commits on `master` (see `README.md` for the list). `AGENTS.md` explains how the repo works. `PLAN.md` covers the open items.

## Summary

- 40 findings: 1 critical, 2 high, 15 medium, 21 low and 1 informational.
- 21 are fixed and 19 are open. Most open items need an owner decision first.
- Most urgent: **SEC-01**. A Supabase service-role key was wired into the app config from the first commit (2025-11-19) until the audit. The value was never committed, but any build made with the variable set contains it, and it bypasses all database access rules. The owner must rotate it.

| Severity | Fixed | Open |
|---|---|---|
| Critical | 0 | 1 |
| High | 1 | 1 |
| Medium | 8 | 7 |
| Low | 12 | 9 |
| Info | 0 | 1 |

## Changes since the first report

- Fixed in the second pass: SEC-10, SEC-11, BUG-17, BUG-19, BUG-22, BUG-25, BUG-26 (config only), BUG-27, and the SearchBar part of BUG-28.
- **BUG-29 is new** and fixed. It was found while wiring BUG-17.
- **BUG-21 is a false positive.** See the false positives section.
- Profile picture uploads now send a content type (`3ad9e21`). The proposed `storage.rules` require `image/*`, so this removes a deployment blocker for SEC-05.
- **Weekly evaluation, corrected.** The first report said it "has never run in production" and "writes calorie adjustments for every user once per session". Both were wrong:
  - The evaluation logic has run in production since `ec95e31` (2026-02-20), after the first weigh-in of each new week. Only the app-start trigger added in `fad590d` has never run in a release.
  - It writes at most once every 6 days per user. It also needs a weight plan, target calories, at least two weekly weigh-in entries and weekly nutrition data. It does nothing when `autoAdjustEnabled` is false.
  - Reading the code turned up a real concern with the app-start trigger. It is described in `PLAN.md`.
- **BUG-26:** the plugin always writes both HealthKit usage strings and fills in defaults when one is missing. The "drop the write-access string" half of the suggested fix therefore does not apply.
- **BUG-27:** the lint job was removed instead of made strict, because the repo has no ESLint config and the owner does not want one added.
- New dead code: `handleCache` in `NutritionHandler.js:8`, added to BUG-28.

## Code that has never run in production

These paths are new or newly reachable. Check them on a device before a release.

- The app-start trigger for the weekly evaluation (`FoodContext.js:573-589`, from `fad590d`, already on master before the audit).
- BUG-10: the Favorites tab shows its existing "coming soon" placeholder. It used to render blank.
- BUG-06: PreviewSplit reloads once after returning from Edit.
- BUG-17: "Create Custom Food" in empty search results opens the custom food screen.
- BUG-29: the recent search Clear button and the per-search remove buttons.
- BUG-22: pressing Active on the current split opens PreviewSplit. The screen itself already runs in production through the card tap.

## Not verified

- Screen rendering. The repo has no component test setup. The newly wired buttons were checked by reading the code and building the bundle, not by tapping them.
- Native builds, EAS (Expo Application Services) builds, and device features: camera, notifications, Google Fit and HealthKit. BUG-26 was checked only through `expo config --type introspect`.
- The Firebase and Supabase consoles: current rules, row-level security (RLS) state and email enumeration protection.
- The proposed rules in `rules/`. They were not run in the emulator, per the owner's call. They were checked by hand against every Firestore read and write in the code.
- That PostgREST (Supabase's REST layer) treats the quoted search terms as literals. This is inferred from its grammar and the request URL, not tested against the server.
- Whether any build containing the service-role key was distributed.

## Findings

Open rows point at current `master`. Fixed rows point at the code before the fix; `git show <commit>^:<path>` shows it.

| ID | Severity | File:line | Evidence | Fix | Status |
|---|---|---|---|---|---|
| SEC-01 | Critical | app.config.js `extra`, eas.json env (2ccc212 to 2454bca) | Service-role key read from env into Expo `extra`, which ships in every build and update manifest. It bypasses RLS. The value was never committed. | Rotate the key, delete the EAS variable | Open, owner action (reference removed in 2454bca) |
| SEC-02 | High | WorkoutHandler.js:648-698 | `createCustomExercise` rewrites the shared `exercises/{muscleGroup}` doc with `setDoc` (no merge, no transaction). Everyone sees everyone's custom exercises, concurrent adds are lost, and rules must let any user rewrite the catalog. | Per-user custom exercises | Open, decision |
| SEC-03 | Medium | firebaseAuthService.js:23-25, :34-51; RegistrationScreen.js:42; AuthContext.tsx:76-86 | Login throws "verify email" after the user is already signed in. Sign-up leaves the new user signed in. The auth listener never checks `emailVerified`, so unverified accounts reach onboarding. | Gate password accounts on `emailVerified`, sign out on failure | Open, decision |
| SEC-04 | Medium | useCustomFood.js:119-122 | Anonymous insert into the shared `barcoded_products` table with the public anon key. Anyone can add rows that every barcode lookup returns. RLS state unknown. | `rules/supabase-rls.sql` | Open, decision |
| SEC-05 | Medium (unverified) | no rules in repo; ProfileScreen.js:106-112 | Firestore and Storage access control exists only in the console, which I could not see. | `rules/firestore.rules`, `rules/storage.rules` | Open, deploy decision. Uploads send a content type since 3ad9e21. |
| SEC-06 | Medium | AuthContext.js:74 | Logout removed only `auth_token`. The splits cache and both recent-search keys are device-wide, so the next account saw the previous user's splits and searches. | Remove them on sign-out | Fixed 6006516 |
| SEC-07 | Medium | WorkoutService.js:65-118; WorkoutContext.js:61-75; StartWorkout.js:272-281 | `activeWorkout` is device-wide and restored on any sign-in. The `workoutService` singleton also keeps the previous user's workout in memory. The next account inherits it and saves it under its own uid. | Key by uid and reset the singleton on user change | Open, decision |
| SEC-08 | Low | NutritionHandler.js:110, :114, :144 | Raw search text inside PostgREST `or()` filters. A comma or parenthesis broke the request and the search threw. | Quote and escape terms; 3 tests | Fixed 8ab4636 |
| SEC-09 | Low | ProfileScreen.js:138 | `updateEmail` without verifying the new address. If the following Firestore write fails, the Auth and Firestore emails diverge. | `verifyBeforeUpdateEmail` | Open, decision |
| SEC-10 | Low | firebaseAuthService.js:10 | A distinct password-reset message for `auth/user-not-found` revealed which emails have accounts. | Treat that error as success | Fixed 4899c6c |
| SEC-11 | Low | WorkoutHandler.js:357, :820 | uid written to console logs | Drop it from the messages | Fixed 5828fdc |
| SEC-12 | Low | `npm audit --omit=dev` | 74 advisories (1 critical, 41 high, 32 moderate). The critical shell-quote one and most highs are in Expo CLI, Metro and Jest tooling. nanoid 3.3.16 is bundled via React Navigation but only generates route keys. | Non-force `npm audit fix`, then a native build | Open, decision |
| BUG-01 | High | useBarcodeScanner.js:187 | `resumeScanning` was recreated every render and listed in an effect that sets state: 134 product loads and 134 focus listeners in 300 ms. | `useCallback`: 1 load, 1 listener | Fixed 0cf51d0 |
| BUG-02 | Medium | learningCompletionService.ts:83 | `new Date('YYYY-MM-DD')` is UTC midnight, so west of UTC the weekly snapshot covered Sunday to Saturday. | Parse as a local date; the new test fails on the old code outside UTC | Fixed 4f58757 |
| BUG-03 | Medium | mealService.js:15-24 | Re-adding a food summed strings: `'250.0' + 250` gave `'250.0250'`, read back as 250.025, so the day under-counted. | `Number()` before summing; tests | Fixed eda0b95 |
| BUG-04 | Medium | AddFoodMenu.js:102 | Create Food opened without `selectedDate`, so foods for a past day were logged to today. | Pass the date | Fixed fd41c37 |
| BUG-05 | Medium | NutritionScreen.js:84-90 | After a failed delete the shared food state restored the item, then the screen removed it again from a stale array. The next write saved the removal. | Leave state to FoodContext | Fixed 7a6c420 |
| BUG-06 | Medium | PreviewSplitScreen.js:175 | Edit passed `splitId` but the editor reads `split`: empty form, and saving duplicated the split. | Pass `split`; reload after Edit | Fixed 9cbfc69 |
| BUG-07 | Medium | WorkoutLibraryScreen.js:50 | A `hasFetched` guard (regression from d54df24) stopped the reload on focus. New or edited items stayed hidden until pull-to-refresh. | Reload on focus, spinner only on first load | Fixed 61a1837 |
| BUG-08 | Medium | WorkoutProgramLibrary.js:41 | Deleting a split never updated the list. | Drop it after a successful delete | Fixed 61a1837 |
| BUG-09 | Low | ExerciseSelectionScreen.js:378 | `loadExercises` returns early once loaded, so a new custom exercise was missing until the screen remounted. | Force one reload on return | Fixed 139b21b |
| BUG-10 | Low | FoodListItem.js:282 | `case 'Favorite'` never matched the `'Favorites'` tab, which rendered blank. | Match the label | Fixed 6472218 |
| BUG-11 | Medium | useBarcodeScanner.js:81, :201-209; BarcodeScannerScreen.js:169 | Batch mode navigates to `BatchScanResults`, which is not a registered screen. The duplicate check compares `barcode_id`, which the data transform drops, so every second scan reads as "already scanned". | Build the screen or remove the mode | Open, decision |
| BUG-12 | Medium | StartWorkout.js:48-62, :284; WorkoutNotificationService.js:31-48 | Only `init()` is called, never `start()`, so `notificationId` stays unset and every `update()` returns early. No workout notification ever shows, yet `init()` still asks for notification permission. If `start()` were called, every update would name the first exercise (`StartWorkout.js:50`). | Call `start()` (never-run code), or stop calling `init()` | Open, decision |
| BUG-13 | Medium | WorkoutScreen.js:514-529; ProgramItem.js:13-24; PreviewSplitScreen.js:69 | Rotation splits use keys "1" to "n". The Workout tab reads weekday keys (always a rest day), library cards list no days, and Preview counts keys, so a gap hides the last day. | Needs a rule for "today" in a rotation | Open, decision |
| BUG-14 | Low | WorkoutProgramLibrary.js:30-51; WorkoutLibraryScreen.js:109-111 | Deleting the active split leaves `activeSplitId` pointing at it. The library highlights nothing, while Dashboard and Workout fall back to the first split. | Clear or reassign on delete | Open, decision |
| BUG-15 | Low | FoodDetailScreen.js:62-66 | Changing the unit keeps the number: 100 g becomes 100 of the new unit (`oz`, `mL`, `cup` or `serving`). | Convert, or keep | Open, decision |
| BUG-16 | Low | MacroProgresBar/MacroProgressBar.js:22 | `hasTargets = true` overrides the prop. Bars can show 100% during the learning phase, and the estimate path never runs. | Remove the override (never-run code) | Open, decision |
| BUG-17 | Low | FoodSearchResults.js:153 | "Create Custom Food" in empty results called `onCreateFood`, which no parent passed. | Wire it to CustomFood | Fixed adcd7ce (never-run code) |
| BUG-18 | Low | PlanSummaryScreen.js:68-74; AuthContext.tsx:59-73 | Setup is marked complete even when the profile refresh failed. `refreshUserData` returns `undefined` instead of throwing, so the catch never runs. | Only on success | Open |
| BUG-19 | Low | ProgressScreen.js:508; WorkoutScreen.js:499 | An early return on an empty split list left the deleted split's data on screen. | Reset before returning | Fixed 8df9f15 |
| BUG-20 | Low | ProfileScreen.js:43-62 | The form is seeded once with defaults (`age \|\| 24`). Later `userData` changes don't show. | Resync on change | Open |
| BUG-22 | Low | WorkoutLibraryScreen.js:115 | The Active button navigated to `SplitSchedule`, which is not a registered screen. | Open PreviewSplit | Fixed e1e92b7 (behavior change) |
| BUG-23 | Low | App.js:58; ChangePasswordScreen.js:17-33 | ChangePassword is registered but nothing navigates to it. Its re-authentication uses the email credential, so it fails for Google accounts. | Remove, or link it and handle Google | Open, decision |
| BUG-24 | Low | MealItem.js:63-83 | The memo comparator ignores quantity, unit, macros and the press handlers. | Compare them, or compare `food` by identity | Open |
| BUG-25 | Low | useWeightData.js:16, :46 | The load key used the UTC day, so two local days could share a key near midnight. | `formatDate` | Fixed 5e6ddfd |
| BUG-26 | Low | app.config.js:10-14 | No react-native-health config plugin, so iOS builds had no HealthKit entitlement. | Add the plugin | Fixed in config 5188cc9; not verified on an iOS build |
| BUG-27 | Low | .github/workflows/tests.yml:5, :7, :56 | CI triggered on main and develop, but the default branch is master, so it never ran. The lint step always passed. | Trigger on master; drop the lint job | Fixed 14ce5c6 |
| BUG-28 | Info | dateUtils.ts:11, :21, :27; createWorkoutUtils.js:15, :58; FoodContext.js:658; NutritionHandler.js:8; SearchBar.js; package.json:27 | Unused exports, `updateFoods` and `handleCache`. SearchBar keeps a recent-search list that nothing displays. expo-auth-session is never imported. | Remove when convenient | Partly fixed b1bb309 (SearchBar test seed); the rest is open |
| BUG-29 | Low | FoodListItem.js:176, :250 | `onRemoveRecentSearch` and `onClearAllRecentSearches` were dropped on the way to FoodSearchResults, so Clear and the remove buttons did nothing. | Forward them | Fixed 01925df (never-run code) |

## False positives checked

- **BUG-21, dashboard dismissal keys built without a uid** (DashboardScreen.js:386-438). The load effect returns early without a uid (line 389). The dismiss handler only runs for notices on screen, which needs `noticesLoaded`, and that is set only after a load with a uid. A `..._undefined` key cannot be written.
- **Weight tracker date keys** (WeightTracker.js:325 vs `processWeightInsForDisplay`): both sides call `toISOString` on local-midnight dates (WeightTracker.js:57, :227, :431). They always match and are never stored or shown.
- **The other dates in learningCompletionService.ts:**
  - Line 50 uses the same UTC parse as BUG-02, but its only caller passes a local-midnight `Date` (FoodContext.js:65-68).
  - Line 129 sorts with the same parse on both sides.
  - Lines 137-140 are off by the timezone offset before rounding to whole weeks. That only matters for a goal switched within hours of Monday midnight.
- **NutritionScreen.js:39 uid read lazily:** the main stack mounts only after the auth listener reports a user.
- **Silent `.catch(() => {})` in useFoodDetails.js:96 and :107:** FoodContext already rolls back and shows "Couldn't save" (FoodContext.js:357-397, 442-460).
- **Division by zero on quantity:** `quantity || 100` turns 0 into 100.
- **The `remainingCalories` route param:** it is passed along but never read on the edit path. FoodContext computes its own.
- **Stale date in route params:** writes use FoodContext's `selectedDateRef`, not route params.
- **Stale StartWorkout state:** the screen is always freshly mounted, because every entry point sits below it in the navigation stack.
- **Duration parsing in WorkoutDetails:** `getFormattedTime` (WorkoutTimerService.js:59-67) emits m:ss under an hour and h:mm:ss above. A two-part value starts with minutes, which matches the tested `durationToMinutes`.
- **History docs without sets:** `finishWorkout` always maps `exercise.sets` (WorkoutHandler.js:133-141).
- **PlanSummary without formData:** it is only reachable from OnboardingFlow.js:64, which passes formData. There are no deep links and no saved navigation state.
- **Google Fit retry notice:** `onConnectedChange(false)` fires only when initialization fails, and retry then runs.
- **Security checks that came back clean:**
  - The Firebase web config, the Supabase anon key and the Google client IDs are public by design. No other secret is in app.config.js or eas.json, and no `.env` was ever committed.
  - Every user-data query filters by uid. The only unscoped read is the shared exercises catalog.
  - The meal, profile and dashboard caches are keyed by uid.
  - `auth_token` holds the uid, not a token. It is written and never read.
  - The global error handler (App.js:39-45) only logs the stack.
  - The URL scheme has no deep-link routing behind it.
  - All network traffic goes through the Firebase and Supabase SDKs.
  - `patches/react-native+0.81.5.patch` only makes the Event phase constants writable. It is a compatibility fix with no security impact.
- **Other candidates rejected:** context keys match their providers, `useFoodSearch`'s request-id guard blocks stale results, and Dashboard and FoodContext agree on Monday week keys.
- **checkJs:** 745 errors. Most are argument-type mismatches (TS2345) in untyped JS. None is a runtime bug on its own.

## TypeScript migration

**Converted** with `git mv`, so `git log --follow` works:
- nutrition: `MealCache.ts`, `dateUtils.ts`, `mealService.ts`, `stepsSyncService.ts`, `weightService.ts`, `useDailyNutrition.ts`, `useRecentSearches.ts`
- profile: `homeSurfaceEngine.ts`
- workout: `durationUtils.ts`
- auth: `AuthContext.tsx`, with a typed `AuthContextValue`

**Shared types added to `src/shared/types.ts`:** `DateInput`, `MealType`, `LoggedFood`, `MealsByType`, `MealGroup`, `MealDayDoc`, `WeightDisplayData`, `HomeNotice` and `UserData.profileSetupComplete`.

**`firebaseConfigService.js`** stays JS, but it now builds auth with `const auth = initAuth()`, so TypeScript callers get a typed `Auth` instead of an implicit `any`.

**Casts:** Firestore reads are cast where they enter the code (`snap.data() as MealDayDoc` five times, `userDoc.data() as UserData` once), one `key as keyof UserData`, and non-null assertions in `MealCache` (two, right after `Map.has` and `set`) and on `useContext(AuthContext)!`. No `any`, `@ts-ignore` or `@ts-expect-error`.

**Skipped on purpose:**
- `WorkoutHandler.js` (1019 lines): it mixes Firestore, Alerts and navigation. Without typed Firestore converters it would be mostly casts.
- `FoodContext.js` (701 lines): its data layer is typed. The provider itself would be a large diff with no component tests to catch regressions.
- `NutritionHandler.js`: Supabase rows are untyped. Convert it after generating database types.
- `WorkoutService.js` and `WorkoutContext.js`: they depend on `WorkoutHandler`'s data shapes.
- Screens and navigation-bound hooks: no navigation param list exists yet.

**tsconfig:** `strict` and `noImplicitReturns` were already on. The audit added `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUnusedLocals` and `noUnusedParameters`. Not enabled, with measured errors: `noUncheckedIndexedAccess` 111 in 9 files, `exactOptionalPropertyTypes` 2, `noPropertyAccessFromIndexSignature` 6, `checkJs` 745.

## Verification

- **Baseline on `fad590d`:** Jest 10 suites / 302 tests pass, `tsc` clean. Hooks lint: 0 rules-of-hooks errors and 39 exhaustive-deps warnings over 168 files.
- **Final on `master`:**
  - Jest 12 suites / 309 tests pass, also with `TZ=UTC` and `TZ=America/Los_Angeles`.
  - `tsc` is clean with the stricter flags.
  - Hooks lint: 0 rules-of-hooks errors and 38 exhaustive-deps warnings over 180 files. The one fewer warning is SearchBar's `loadRecentSearches`, which stopped capturing render values once the test seed was removed.
  - `expo export --platform android`: 3440 modules, 9.41 MB of Hermes bytecode.
  - `expo config --type introspect`: the HealthKit entitlement is present and the existing usage strings are kept.
- **Harness** outside the repo (`C:\Users\birladea\audit-scratch\harness`, not committed): 3 suites / 6 tests. They cover the scanner loop, the logout cleanup and the `firebaseConfigService` equivalence.
- The second-pass fixes add no unit tests. They are UI wiring, config, or code in folders that `testMatch` does not cover.
- Edits were made with exact-match replacements that fail if the text matches zero times or more than once.
