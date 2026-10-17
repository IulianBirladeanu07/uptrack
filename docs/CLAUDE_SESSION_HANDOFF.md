# Claude session handoff

Updated 2026-10-17. Start with this handoff, then read `AGENTS.md` before changing code.

## Repository snapshot

- Repository: `IulianBirladeanu07/uptrack`
- Branch: `master`
- Base commit for the current Profile batch: `1573d67 refactor: extract progress screen model`. The Profile batch below is uncommitted at handoff update time; verify `git log --oneline -10` and `git status --short --branch` before continuing.
- Three pre-existing untracked patch files were present at batch start and left untouched: `0001-document-firebase-and-supabase-structure.patch`, `0001-move-step-flushing-into-steps-flusher.patch`, and `0002-share-meal-write-wiring-in-food-provider.patch`. Preserve them and do not include them in this refactor batch.
- This is an inventory-based repository review, not a claim that every source file received a line-by-line bug audit.

## How to continue

The owner's recent workflow has been one small, behavior-preserving refactor at a time. The owner reviews, commits, and pushes each batch; do not commit or push unless explicitly asked. If commit commands are requested, omit a `Co-authored-by` trailer.

Before each batch:

1. Check `git status --short --branch` and recent commits. Preserve any changes that are not yours.
2. Read `AGENTS.md`, then inspect the target and its callers/tests. Read `docs/APP_FLOW_AUDIT_HANDOFF.md` and the relevant `audit/` notes if the work concerns correctness or user flows.
3. Make a focused change, preserve user-visible behavior, add tests for extracted logic or confirmed defects, and update directly related docs.
4. Run focused tests, `npx tsc --noEmit`, and `git diff --check`. Run the full Jest suite for a coherent batch. Use Android Expo export for screen/import changes when appropriate; test date logic in `America/Los_Angeles`; run `npm run test:rules` for Firestore rules/access changes.
5. Report what was actually verified. Jest has React Native Testing Library tests for `FoodSearchResults`, `NutritionScreen` and the `FoodProvider` meal writes (rendered as a hook, with Firebase, storage and the step display mocked); there is no navigation or device-level coverage, so do not describe a bundle export or helper test as an end-to-end UI test.

6. Update this file in the same commit as the batch. Add the batch under "Work completed", replace the "latest validation" block with the numbers you actually ran, refresh the roadmap, and name the next candidate. Keep entries short and factual. Never record a check that was not run.

Claude chat sessions cannot edit the owner's checkout. They hand over numbered patches made with `git format-patch`, which the owner applies with `git am` using exact file names. Copilot and other agents that work in the checkout can edit files directly.

Do not combine the ongoing refactor with the separate app-flow/security audit. If the owner asks to continue refactoring, keep doing that; if asked to resume the audit, follow its own prompt and revalidate stale findings before acting.

## Work completed in the recent modularity/refactoring sequence

The work below is already committed. Use `git log --oneline` to inspect each change; do not redo it without a concrete reason.

### Nutrition and shared data logic

- Removed unused nutrition APIs and consolidated optimistic meal-write handling.
- Extracted nutrition summary calculations and meal-cache logic; removed dead handlers.
- Split WeightTracker presentation and input logic, then reduced screen responsibilities.

### Workout home and schedule

- Isolated workout history summaries and route-data parsing.
- Extracted the upcoming-week cards, main workout card, and preview modal.
- Extracted schedule display projection, active split selection, home view-model logic, and schedule loading/state.

### Active workout

- Reduced `StartWorkout.tsx` by moving session initialization/restoration, route-driven exercise selection, session finish/exit lifecycle, keyboard navigation, and exercise-menu actions into focused modules/hooks.
- Shared the workout-user guard where multiple hooks need to reject stale account work.

### Exercise selection

- Moved catalog enrichment, identity-keyed lookup/count construction, filtering/grouping, and FlatList row generation into `src/features/workout/screens/ExerciseSelectionScreen/exerciseSelectionData.ts`.
- Integrated those helpers into `ExerciseSelectionScreen.tsx`; added seven tests and Jest discovery for this screen directory.
- Preserved filtering fields/order, identity keys, list IDs, and the existing count behavior for repeated group entries.

### Exercise item

- Moved the pure logic out of `ExerciseItem.tsx` into `src/features/workout/components/ExerciseItem/exerciseItemUtils.ts`: rest time formatting, the set, rep range and rest preset lists, custom rep range and rest time detection, the sets and reps label, and the custom rest modal's input cleaning, seconds limit and minutes/seconds conversion.
- Added 15 tests in `exerciseItemUtils.test.ts` and Jest discovery for the folder. The moved functions were compared against the original inline code on thousands of inputs with no difference.
- Moved `CustomButton`, `ModalWrapper` and `Chip` into `ExerciseItemControls.tsx`, and `RestTimeModal` and `RestTimeSelector` into `RestTimeControls.tsx`. `ExerciseItem.tsx` went from about 790 to about 380 lines. The moved blocks and the remaining component body were checked to be byte-identical to the original apart from `export` keywords and imports; `ExerciseItem` itself and its default export are unchanged.
- `ReviewStep.tsx` has its own `formatRestTime` that disagrees with this one (90 seconds shows as "1m 30s" there and "1.5m" on the exercise card). Merging them would change a visible string, so it is left for the owner to decide.

### Create exercise

- Moved the picker option data (`EXERCISE_DATA`), the form types, the blank form factory, progress calculation, validation, the create payload builder and the picker search filter out of `CreateExerciseScreen.tsx` into `src/features/workout/screens/CreateExerciseScreen/createExerciseForm.ts`. The screen went from 648 to 581 lines.
- Added 17 tests in `createExerciseForm.test.ts` and Jest discovery for the folder. The validation, progress, option data and filter were compared against the original inline code, taken verbatim, on 96 cases with no difference.
- Moved `OptionItem` and `ModalPicker` (picker UI, modal animation and search box) into `src/features/workout/screens/CreateExerciseScreen/ExerciseModalPicker.tsx`, which exports `ModalPicker` and the `ModalPickerHandle` type. `CreateExerciseScreen.tsx` went from 581 to 309 lines. A script confirmed the moved block is identical to the original apart from the two `export` keywords, and that the screen component and its default export are identical to the original. No new tests: the moved code is UI only and there is no component test harness.

### Create template

- Moved the decision logic of the route-driven add/replace handling out of `CreateTemplateScreen.tsx` into `src/features/workout/screens/CreateTemplateScreen/templateSelectionPlan.ts` as the pure `planTemplateSelection`. It returns one of `none`, `replace-failed`, `replace-duplicate`, `replace`, `add` or `add-single`. The screen effect still owns ids, state updates, the undo state and every notification string; a single added exercise still goes through `addExerciseWithAnimation`, so its duplicate check is unchanged. `ExerciseRow` now lives in the new file.
- Added 19 tests in `templateSelectionPlan.test.ts` and Jest discovery for the folder. Before the tests were added, the original inline effect (taken from `HEAD`) and the new effect were run side by side with stubbed state setters on 294 combinations of template rows, selections and replace ids. The recorded state updates, undo state and notifications were identical, and the same harness failed when the planner was deliberately broken. That harness was temporary and is not in the repo.
- Not moved: the undo/redo state handling, the per-field list updaters and the step navigation are still in the screen. The exhaustive-deps warning about a missing `navigation` dependency on the selection effect existed before and was left alone.

### Food search results

- Added 20 component tests to `src/features/nutrition/components/NutritionItem/FoodSearchResults.test.tsx` (React Native Testing Library, already in the repo) covering the filter pills and their counts, each filter's results and best match, the result count wording, the Add to Log button, results without a query, and the loading, error and retry, no-results and create, empty prompt and recent searches states. They were written first and passed against the unchanged component, and a deliberate threshold change made them fail.
- Moved the two result filters into `foodSearchFilters.ts` (`applyFoodFilter`, `LOW_CALORIE_LIMIT`, `HIGH_PROTEIN_MIN`) so the pill counts and the filtered list share one definition instead of repeating the 200 calorie and 10 g protein rules. Added 6 unit tests. `FoodSearchResults.tsx` changes by about 10 lines; its JSX, the inline styles and its props are unchanged.
- Not covered by the new tests: removing a single recent search (the close icon has no label or test id) and the visual layout.

### Food context meal writes

- Added `src/features/nutrition/context/FoodProvider.test.tsx` (15 tests, React Native Testing Library `renderHook` with `FoodProvider` mounted for real). Firebase auth and Firestore, AsyncStorage, `mealService` reads and writes, the persisted meal cache, the learning service and the step display are mocked. It covers add (consolidation of the same food, serialized simultaneous adds, rollback after a failed write, invalid parameters, a failed day load), delete (success, unknown id, failed write) and update (success keeps id and usage count, unknown id, failed write), the alert text and error message on each failure, no alert or error for a write that fails after the account changed, and rejected mutations with nobody signed in. They were written first and passed against the unchanged provider.
- `jest.config.js`: the `nutrition/context` pattern now includes `tsx`.
- Refactor in `FoodContext.tsx` (about 11 lines shorter): the three handlers (`handleAddMeal`, `handleDeleteMeal`, `updateMealInDatabase`) each repeated the same `persistOptimisticMealWrite` wiring and the same failure reporting. They now call two provider callbacks, `writeMealOptimistically` (fills in the cache read, state update, cache persist and current-user check; the caller still supplies the next foods and its own rollback) and `reportMealFailure` (current-user check, `handleError`, then the save-failed alert). Ordering, error contexts (`add meal`, `delete meal item`, `update meal item`, `load meals`), alert text and return values are unchanged. A deliberate removal of the current-user check in `reportMealFailure` made the account-change test fail.
- Not changed in that batch: step flushing, initialization, the auth listener, date change handling and the learning/weekly-evaluation effects.

### Steps flushing

- Added 7 provider tests to `FoodProvider.test.tsx` for the step history writes (the step display is mocked and its `onStepsHistory` prop is captured): only past days that are new or higher are written and today is skipped; the same entries are not written twice; a failed write is retried with the same entries on the next flush; entries received before the user data loads are written when it arrives; user data for another uid is never written to; a second batch during a write waits for the next flush; pending and written entries are dropped when the account changes. They passed against the unchanged provider.
- Moved the three step refs and `flushSteps` out of `FoodContext.tsx` into `src/features/nutrition/context/StepsFlusher.ts`, a plain class with `queue`, `reset` and `flush`. The provider owns one instance and gives it getters for the current uid, user data and user generation, so the checks still read live values after the write. `flush` is the previous callback body unchanged (same early returns, same write, same restore of failed entries, same `persistDailySteps error:` log, same in-flight guard per generation). `reset` clears pending and written entries only, as the auth listener did before; it does not clear the in-flight marker. `FoodContext.tsx` is about 651 lines.
- Added 9 unit tests in `StepsFlusher.test.ts`, including a write that fails after the account changed (no restore, no log), which the provider tests do not reach. Deliberately removing the `reset` call, the current-user check on failure, or the in-flight guard each made a test fail.
- Not changed: how `retryStepsConnection`, the user-data effect and `handleStepsHistory` trigger a flush.

### Dashboard workout summaries

- Moved the Dashboard's weekly workout count and latest workout completed today into `src/features/dashboard/screens/DashboardScreen/dashboardWorkoutSummary.ts`. `DashboardScreen.tsx` still owns the state and rendering; both calculations retain their original memoization and date-time behavior.
- Added five tests for the inclusive local Monday boundary, empty history, selecting the latest same-day workout, absent details, and the displayed duration/exercise count. Added Jest discovery for `DashboardScreen`.
- A deliberate change from `date >= weekStart` to `date > weekStart` made the Monday-boundary test fail before restoring the original comparison.
- Not changed: the weekly count includes a history entry with a future timestamp if it falls after Monday of the current week. This matches the old implementation; decide separately whether future-dated records should be excluded.

### Progress screen model

- Moved the existing ProgressScreen derived-data pipeline into `src/features/progress/screens/ProgressScreen/useProgressScreenModel.ts`. The hook retains each original `useMemo` boundary and dependency list, including the existing `rollingWeekStats` dependency; screen state, navigation, effects and rendering remain in `ProgressScreen.tsx`.
- Added two hook tests that compare every derived model against the existing `progressEngine` functions and verify the default 12-week range, range changes and unknown-key fallback. Added Jest discovery for `ProgressScreen`.
- A deliberate change to the unknown-range fallback made both tests fail; restoring the 12-week fallback made them pass.
- The React Hooks lint emits the same single `rollingWeekStats` unnecessary-dependency warning from the extracted hook as it did from the original ProgressScreen. It is preserved, not introduced by the refactor.

### Profile form state

- Moved profile draft initialization, refresh synchronization, dirty counts, identity-error clearing, field updates and bounded numeric stepping into `src/features/profile/components/Profile/useProfileFormState.ts`. `ProfileScreen.tsx` still owns persistence, validation decisions, navigation and rendering.
- Added six hook tests for seeded state, refreshing a pristine form, retaining unsaved form/identity/photo changes across refreshed user data, counting plan/identity/photo changes, clearing the edited identity error, and clamping/rounding steppers. Added Jest discovery for the Profile component folder.
- A deliberate removal of the dirty-draft guard made the refreshed-user test fail (and reset form state/count tests); restoring it made all tests pass.
- The hook does not reset validation errors during a pristine profile refresh, matching the original effect.

The latest validation was:

- `npx jest --runInBand --ci src/features/profile/components/Profile/useProfileFormState.test.ts`: 6 tests passed; a deliberate removal of the dirty-draft guard made the draft preservation tests fail as expected.
- `npx jest --runInBand --ci src/features/profile/components/Profile/useProfileFormState.test.ts src/features/profile/utils`: 8 suites / 161 tests passed.
- `npx jest --runInBand --ci`: 98 suites / 900 tests passed in `UTC`, `America/Los_Angeles` and `Europe/Bucharest`.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npx expo export --platform android --output-dir C:\Users\iulia\AppData\Local\Temp\uptrack-profile-form-export-20261017`: succeeded; temporary output was removed. This checks bundling only; no screen was run on a device.
- Hooks lint on `useProfileFormState.ts` and its test passed with no warnings or errors. Full-source lint was not run for this batch.

## Repository map

- Expo SDK 54 / React Native 0.81.5 / React 19.1 app, primarily JavaScript with TypeScript in newer and refactored areas.
- App providers and the single React Navigation stack are wired in `App.js`.
- Feature code is under `src/features/{auth,dashboard,nutrition,profile,progress,workout}`. Shared navigation, components, Firestore helpers, theme, and utilities are under `src/shared`.
- Firebase owns authenticated user data; Supabase serves the shared food catalog. Canonical backend rules are in `firebase/` and `supabase/`.
- Jest uses explicit `testMatch` directory patterns in `jest.config.js`. Verify new tests are discovered; do not assume every `*.test.ts` file runs automatically.
- CI workflows are in `.github/workflows/`; Maestro's existing Android smoke flow is in `.maestro/flows/`.
- Operational, testing, release, and device guidance lives in `docs/`. The app-flow audit and its temporary issue/fix notes live in `audit/`.

## Suggested refactoring roadmap

This is a ranked starting point based on the current source inventory, not a mandate to refactor by line count. Inspect responsibilities and coupling first; skip or reorder when the code shows a better seam.

1. **FoodContext:** meal writes and step flushing are extracted and tested. Initialization, the auth listener and date-change handling remain; move them only with provider tests extended first. This area has account-scoped async state, caching, rollback, and date semantics; coordinate with the open Nutrition audit rather than duplicating it.
2. **Profile follow-ups:** inspect other profile screens only for a cohesive seam; the form-state lifecycle of `ProfileScreen.tsx` is now extracted and tested.
3. **Workout optional follow-ups:** `ExerciseItem` swipe gesture/card header and `CreateTemplateScreen` undo/list updater logic remain possible targets, but inspect whether each is a meaningful seam before proceeding.
4. **Maintenance pass:** reconcile directly related docs and test discovery after each batch. Do not start a broad rewrite, add a new lint framework, or reformat unrelated code.

## Separate app-flow audit: status and source of truth

The app-flow audit is not complete. It has prior passes across Workout, Progress, Nutrition, Auth, Profile, and Dashboard, with many regression tests and confirmed fixes already recorded. Those passes are not proof that all bugs are fixed or that the app was tested end-to-end.

If asked to continue that audit:

- Read `docs/CLAUDE_CONTINUE_AUDIT_PROMPT.md`, `docs/APP_FLOW_AUDIT_HANDOFF.md`, `audit/FINDINGS.md`, and the relevant sections of `audit/PLAN.md`.
- The audit handoff and plan are older than current code. Reproduce each candidate against the present implementation before changing it. Macro-bar and memoization items, among others, are already described as addressed.
- Respect the documented owner decisions: do not change weekly evaluation timing or serving-unit conversion semantics without asking. Device/console checks and any deployment of Firebase/Supabase rules or SQL belong to the owner.
- Record exact validation and remaining device/product checks in the audit handoff when completing an audit batch.

## Important invariants

- Use local date helpers for `YYYY-MM-DD` day keys; do not generate them with `toISOString()` or parse date-only strings with `new Date()`.
- Keep Firestore data scoped to the authenticated `uid`. New per-user AsyncStorage keys must include the `uid` or be cleared on sign-out.
- `workoutService` is a singleton; guard and reset account-sensitive in-memory state.
- Check `App.js` before adding navigation destinations. Routes do not have a typed param list.
- Firestore rules deny reads of missing documents for some user-data collections. Follow `AGENTS.md` and run rule tests for Firestore access/rule changes.
- Never print environment values, credential files, or secrets. Native config belongs in Expo config/plugins, not generated native folders.
- Ask the owner before product behavior changes. Keep reviewable batches small and avoid drive-by refactoring.
