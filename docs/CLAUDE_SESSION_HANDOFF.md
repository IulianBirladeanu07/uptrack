# Claude session handoff

Updated 2026-10-24. Start with this handoff, then read `AGENTS.md` before changing code.

## Repository snapshot

- Repository: `IulianBirladeanu07/uptrack`
- Branch: `master`
- The future-dated completion-summary fix was published in `8cbd45f fix: ignore future workouts in completion summaries`; the weekly Workout count follow-up is recorded below.
- Three patch files mentioned in an earlier handoff (`0001-document-firebase-and-supabase-structure.patch`, `0001-move-step-flushing-into-steps-flusher.patch`, and `0002-share-meal-write-wiring-in-food-provider.patch`) are not present in this checkout at the current base commit.
- This is an inventory-based repository review, not a claim that every source file received a line-by-line bug audit.

## Latest batch: Progress chart sizing and Food Selection refinements

- `ProgressScreen.tsx` now measures the persistent screen width once and derives chart width from the existing screen/card spacing and border tokens. The chart cards no longer keep their own width state, so changing Nutrition/Training tabs does not remount charts into a temporary empty measurement state.
- `FoodListItem.tsx` no longer gives the Frequent and Recent `FlatList`s fixed row sizes even though their rows/cards can have different heights. This prevents incorrect offsets during list scrolling; visual styles and ordering are unchanged.
- `FoodSelectionHeader.tsx` keeps the calorie progress summary and removes the macro-balance row, which competed with food browsing and repeated macro information already visible on food rows and the Nutrition screen.
- The Food Selection calorie card is labeled “Calories today”; its remaining/over amount includes `kcal` for clarity. The calorie number, flame, and progress fill use the existing orange accent. The Scan button matches the search field's 52-point height.
- Added `progressChartWidth.test.ts` for inset calculations and narrow/unmeasured widths, FoodListItem checks that both lists use measured layouts, and FoodSelectionHeader rendering/helper checks for the calorie card.
- Validation: focused Jest passed (2 suites / 5 tests); `npx tsc --noEmit`, Android Expo export and `git diff --check` passed. The full Jest suite passed earlier in this batch (167 suites / 1,279 tests), before the last Food Selection refinements. No device preview was run.

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

The work below records completed batches. Use `git status --short` and `git log --oneline` to distinguish the current uncommitted changes from committed work; do not redo a batch without a concrete reason.

### Nutrition meal calorie display

- Removed the meal summary row and per-meal calorie labels from `MealContainer`; removed the totals calculation that only fed those labels. Compared the unified segmented-control variant against the existing compact pill buttons and restored the pill layout. Kept the orange selected state and lifted inactive icon/label contrast to the theme's tertiary text color.
- Updated the existing component assertions for the selector. Tests and device preview were not run in this batch; `git diff --check` is the only validation performed.
- Tried a compact-height meal card for short food lists, but the owner rejected the resulting empty-screen layout; reverted that experiment. The original card sizing and scrolling behavior are restored.
- Added `colors.background.track` (`#2B3544`) for the unfilled Nutrition calorie ring and macro bars, making progress tracks consistent and visible without competing with their fills. A lighter trial was rejected. Added a contrast assertion; tests and device preview were not run.
- Slightly reduced CircularProgress's main value size and added vertical breathing room between its center lines. Tests and device preview were not run.
- CircularProgress now closes fully at 100%; progress remains capped at a full ring above the target, while the center text reports calories over. Tests and device preview were not run.
- Added a “Meal total” footer below the logged-food list, summing calories and macros with the same orange calorie and C/P/F chip colors as the food rows. It stays visible while long meal lists scroll and is hidden when the selected meal is empty. Increased the total calorie size slightly and brightened its divider for clearer hierarchy. Tests and device preview were not run.
- Nutrition now selects a default meal from local time on first mount (breakfast 05:00–10:59, lunch 11:00–15:59, dinner 16:00–21:59, snacks otherwise). The selected meal remains in screen state when navigating away and back while the screen stays mounted. Tests and device preview were not run.
- Fixed Food Selection interactions: the inactive search overlay leaves room for the barcode action; food row checkmarks now reflect the selected-food state across lists and detail returns; recent-meal Add All applies an explicit add/remove state instead of toggling every item. Tests and device preview were not run.
- Restored the Progress screen's compact range options beside the Nutrition/Training tabs, removing the newer full-width segmented-control placement. Progress data calculations and range behavior remain unchanged. Tests and device preview were not run.

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
- Moved focus-triggered catalog loading, first-focus cache clearing, retry/error state, and refresh-after-create behavior into `useExerciseCatalog.ts`.
- Added four hook tests for initial loading, errors/retry, forced refresh after creating an exercise, and non-Error failures.

### Workout template loading

- Moved template-to-session exercise and set construction into `buildWorkoutFromTemplate.ts`; `WorkoutService` retains history fetching, async user/session guards, and state updates.
- Added four tests for history fallbacks, rep-range defaults, fresh set IDs/validation state, invalid set counts, and source immutability.

### Workout exercise updates

- Extracted pure exercise/set updates from `WorkoutService` into `workoutExerciseUpdates.ts`; the service continues to own listener notifications and immediate versus throttled updates.
- Added tests for validation and immutable updates, set/exercise add/delete, movement/replacement, duplicate identities, and all-sets-validated checks.

### Workout completion payload

- Moved PR annotation and Firestore history-record projection into `buildWorkoutCompletionData.ts`; `workoutSessionService.ts` retains authentication checks, Firestore writes, confirmation flow, and navigation.
- Added tests for PR annotation, persisted set conversion, bodyweight/zero-rep handling, removal of session-only history data, and input immutability.

### Exercise image prefetch

- Moved remote-image batching and per-URL prefetch status tracking into `exerciseImagePrefetch.ts`; `exerciseCatalogService.ts` retains catalog and custom-exercise loading.
- Added tests for remote URL filtering, three-image batches and stagger timing, successful URL reuse, failure logging/status retention, and explicit status clearing.
- Preserved the existing behavior that a failed image is not retried until image prefetch status is cleared.

### Workout split schedule data

- Moved split schedule hydration and rest-day sanitization into `workoutSplitData.ts`; `workoutSplitService.ts` retains authentication, Firestore access, cache invalidation, and error handling.
- Added tests for current-template enrichment, preserving schedule metadata, stale/missing template details, empty schedules, and rest-day fallback values.
- Preserved the existing distinction between truthy fallbacks for template names/exercises and nullish fallback for duration.

### Workout split preview and editing data

- Moved the preview screen's selected-day, cycle composition, and muscle coverage calculations into `previewSplitData.ts`.
- Moved split schedule transitions and type-specific key filtering into `splitScheduleEditor.ts`; the screen retains validation, alerts, and React state ownership.
- Added tests for schedule assignment/clear/add/remove, weekly/rotation filtering, scheduled/rest-day aggregation, uncovered groups, numeric values, and selected-day fallbacks.
- Kept preview calculations distinct from create/review statistics because their existing set-count parsing differs (`Number` for composition versus `parseInt` for selected-day stats).

### Workout template-name policy

- Moved duplicate-name validation, normalized registry keys, malformed-registry handling, and the existing duplicate-name error class into `templateNameRegistry.ts`. Firestore query/transaction behavior remains in `workoutTemplateService.ts`.
- Added focused tests and re-exported the error class from the original service module to preserve callers.

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
- UI follow-up (2026-10-24): grouped the non-best search results into one themed card with row dividers, reduced the best-match border to the standard one-pixel treatment, and replaced the No Image text fallback with the themed food icon. No behavior or search callbacks changed. No tests or device preview were run for this visual-only pass.

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

### FoodProvider initialization

- Added four provider tests for cached meals displaying before fresh history, retry after initialization failure, ignoring a previous account's pending load, and clearing the previous account's persisted cache on sign-out.
- Extracted the cache-then-fresh meal loading sequence to `src/features/nutrition/context/loadInitializationMeals.ts`. `FoodContext.tsx` retains ownership of account-generation guards, provider state updates, error handling, retry state, and cache persistence. Existing cached-first display and stale-account behavior are preserved.
- Not changed: auth listener/reset logic, selected-date loading, or learning and weekly-evaluation effects.

### FoodProvider selected-date loading

- Added four provider tests for loading and displaying a newly selected date, surfacing a current-date read failure, ignoring a failed read after selecting another date, and ignoring an old user's selected-date response after an account switch.
- Moved selected-date callback orchestration from `FoodContext.tsx` to `src/features/nutrition/context/selectedDateMealChange.ts`. The provider still owns the UID/date/mounted guards, cache lookup and state updates; `loadSelectedDateMeals` still handles stale completion/error suppression.
- Not changed: auth listener/reset logic or learning and weekly-evaluation effects.

### FoodProvider auth transitions

- Added three provider tests for preserving data on same-UID notifications, resetting account-scoped cache/meals/steps/errors while a new account loads, and clearing account state plus loading/error flags on sign-out.
- Moved auth callback sequencing into `src/features/nutrition/context/foodAuthStateChange.ts`. `FoodContext.tsx` retains the reset operations, generation increments, refs and React state setters; callback order and same-UID behavior are preserved.
- Not changed: weekly evaluation and learning effects.

### FoodProvider background evaluations

- Added provider tests for learning completion refreshing user data, weekly evaluation running once per account and ignoring stale results, and steps-bonus backfill running once per account after steps connect.
- Moved the learning completion, steps-bonus backfill and weekly evaluation effects into `src/features/nutrition/context/useFoodBackgroundEvaluations.ts`. The hook owns the once-per-account refs and exposes a reset callback used during account changes; service calls, request-generation guards, error behavior and refresh conditions are preserved.
- Not changed: evaluation service behavior or its timing/eligibility rules.

### Dashboard workout summaries

- Moved the Dashboard's weekly workout count and latest workout completed today into `src/features/dashboard/screens/DashboardScreen/dashboardWorkoutSummary.ts`. `DashboardScreen.tsx` still owns the state and rendering; both calculations retain their original memoization and date-time behavior.
- Added five tests for the inclusive local Monday boundary, empty history, selecting the latest same-day workout, absent details, and the displayed duration/exercise count. Added Jest discovery for `DashboardScreen`.
- A deliberate change from `date >= weekStart` to `date > weekStart` made the Monday-boundary test fail before restoring the original comparison.
- The separate `countWorkoutEntriesThisWeek` helper in `src/features/workout/utils/workoutHistory.ts` also excludes timestamps after `now`, keeping the weekly count consistent with the completed-workout summaries.

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

### Profile save lifecycle

- Moved the Profile screen's email-verification, optional profile-picture upload, Firestore write, refresh, state commit, alerts, and saving-state lifecycle into `useProfileSave.ts`. The screen retains validation, confirmation prompts, navigation, and rendering.
- Added six hook tests covering successful save, missing authentication, recent-login email failure, pending email confirmation, photo upload, and persistence failure.

### Onboarding plan confirmation

- Moved plan persistence, profile refresh, completion-state update, and save/refresh error handling from `PlanSummaryScreen.tsx` into `usePlanConfirmation.ts`. The screen retains plan calculation and presentation.
- Added five hook tests for successful completion, missing authentication, write failure, an unavailable refreshed profile, and refresh errors. Added Jest discovery for Profile screen tests.
- Inspected the remaining Profile screens; `OnboardingFlow` and `OnboardingStepScreen` remain orchestration and presentation respectively, with no additional cohesive extraction identified.

### Nutrition account reset

- Moved the Nutrition provider's account-scoped reset transition into `resetFoodAccountState.ts`, keeping auth callback sequencing and account initialization in `FoodContext.tsx`.
- Added tests for invalidating pending work, clearing the meal/step caches and account state, and selecting the correct loading state for account switches versus sign-out. Existing provider tests continue to cover account-change integration.

### CreateTemplate exercise updates

- Extracted pure list updates to `src/features/workout/screens/CreateTemplateScreen/templateExerciseUpdates.ts`: restore a deleted row at its prior index, restore a replaced row by the replacement id, and replace a row while preserving its previous rest time (or the existing 180-second fallback).
- Added seven tests for restoration order, append behavior, missing replacement rows, immutable updates, id assignment, and rest-time preservation/fallback. Existing `templateSelectionPlan.test.ts` continues to cover selection planning and duplicate handling.
- The screen retains undo-state timing, notification text/actions, generated ids and selection flow. The existing screen has no redo operation; none was introduced.

### ExerciseItem swipe intent

- Extracted the existing horizontal swipe threshold/direction decision to `src/features/workout/components/ExerciseItem/exerciseItemUtils.ts` as `getExerciseSwipeAction`. `ExerciseItem.tsx` continues to own gesture setup, animation timing, haptics and callbacks.
- Added tests for exact threshold boundaries and both action directions.

### WorkoutHistory section grouping

- Extracted month/year headings and section grouping to `src/features/workout/screens/WorkoutHistoryScreen/workoutHistorySections.ts`. The screen still owns memoization and rendering; grouping preserves the original first-seen month and row order, and timestamps without seconds remain in `Recent`.
- Added three tests for month formatting, missing/zero timestamps and stable grouping order. Added `WorkoutHistoryScreen` test discovery to `jest.config.js`.
- Extracted the existing history-to-StartWorkout route payload mapping to `src/features/workout/screens/WorkoutHistoryScreen/workoutHistorySelection.ts`; navigation and the active-workout guard remain in the screen. Two tests cover mapped metadata, set-value conversion and existing falsy-value defaults.
- Extracted date badges and time-of-day workout labels to `workoutHistoryPresentation.ts`, preserving local-time boundaries and custom template-name precedence. Added tests for recent/today/yesterday/date labels and every time-of-day boundary.
- Extracted the card's derived totals, duration, labels and exercise best-set/PR presentation into `workoutHistoryCardData.ts`; the screen retains row rendering and interaction. Tests cover summary fields, PR styling data, today's label, duration conversion and empty/missing-value defaults.

### CreateSplit review summary

- Extracted schedule-wide workout/day/duration/set/muscle-group aggregation and selected-day set/muscle-group summaries into `src/features/workout/screens/CreateSplitScreen/steps/splitReviewStats.ts`; `ReviewStep.tsx` retains view state and rendering.
- Preserved the separate historical set-count behavior: aggregate stats fall back from `numSets` to `sets`, while the selected-day card counts only parsed `numSets`. Tests explicitly cover the distinction, rest-day exclusion, ordering and defaults.
- Added Jest discovery for the CreateSplitScreen test directory.

### WorkoutDetails card summary

- Extracted total set and personal-record counts to `src/features/workout/screens/WorkoutDetailsScreen/workoutCardSummary.ts`; `WorkoutDetails.tsx` retains memoization and rendering.
- Added tests for set/PR aggregation and empty workouts. Added Jest discovery for the WorkoutDetailsScreen test directory.

### Workout screen preview summaries

- Extracted preview duration/set/exercise counts and upcoming-workout muscle-group labels to `src/features/workout/screens/WorkoutScreen/workoutPreviewSummary.ts`; `WorkoutPreviewModal.tsx` and `ComingUpCard.tsx` retain their component/UI behavior.
- Added tests for existing duration formatting, declared-set counting, empty selection defaults and unique muscle-group order. `WorkoutScreen` tests are already discovered by Jest.
- Extracted the `ThisWeekCard` scheduled-day-to-preview mapping to `thisWeekSchedule.ts` as `toScheduledWorkoutPreview`; the component keeps the no-workout tap guard. Added tests for template/duration defaults, mapped content and missing schedule data.

### Workout template row keys

- Replaced `Math.random()` fallback keys in `WorkoutTemplateLibrary` with the stable top-level id, nested data id, or a deterministic position-based fallback. Added tests for id precedence and repeated key generation, plus Jest discovery for `WorkoutLibraryScreen`.

### ExerciseHistory presentation

- Extracted the existing local-date labels (Recent/Today/Yesterday/date) and chart text anchors to `src/features/workout/components/ExerciseHistoryScreen/exerciseHistoryPresentation.ts`. The screen and chart still own layout and rendering.
- Added tests with explicit local dates and chart-anchor positions; added Jest discovery for `ExerciseHistoryScreen`.

### ExerciseHistory session mapping

- Extracted matching-set filtering, valid-set filtering, best-set selection and volume calculation from the Firestore service into `toExerciseHistorySession` in `src/features/workout/utils/exerciseHistory.ts`.
- `exerciseHistoryService.ts` still owns authentication, query construction, iteration and error logging/rethrow. The helper returns `null` for sessions with no valid matching sets, as the original service skipped them.
- Extended `exerciseHistory.test.ts` to cover invalid sets, total volume, best-set metadata, empty session skipping and workout-name fallback.

### ExerciseHistory chart model

- Extracted chart point scaling/order, line and area path creation, and sparse-label selection into `src/features/workout/components/ExerciseHistoryScreen/exerciseHistoryChart.ts`; SVG rendering remains in the screen.
- Added tests for the minimum session threshold, newest-first input reversal, graph coordinates/paths, and the six-point label-density boundary.

### Rotation schedule display coverage

- Added a regression test in `workoutScheduleDisplay.test.ts` for the current day and upcoming workouts across a rotation rest day and cycle wrap. Production scheduling code was not changed.

### Excluding future-dated completed workouts

- Updated the Dashboard weekly count/today summary and Workout-screen weekly/latest/today summaries to ignore history timestamps after the injected/current `now`.
- Added regression tests for future-only records and mixed past/future entries. This intentionally changes the prior behavior that counted future-dated entries as completed workouts.
- Updated `countWorkoutEntriesThisWeek` to count only the current local week through `now`; coverage includes later-today and later-this-week records.

### Dashboard weekly overview

- Extracted the Dashboard weekly chart/stat card into `WeeklyOverview.tsx` and its local-week calorie-day and weight-delta projections into `weeklyOverviewModel.ts`. The Dashboard screen now delegates the card; its date boundaries, labels, values, goal colors, and render dependencies remain unchanged.
- Added model tests for local Monday/Sunday boundaries, hidden future days, calorie defaults, the three-day weight threshold, goal alignment, and rounded-zero changes. `DashboardScreen.tsx` decreased from 691 to 508 lines.

### Dashboard scheduled workout loading

- Moved the focus-triggered split cache/Firestore load lifecycle and scheduled workout projection into `useDashboardScheduledWorkout.ts`. It retains the 15-minute cache TTL, selected-split rotation resolution, cache fallback/error reporting, and cancellation guard. The screen now consumes the hook's workout/loading/error state; `DashboardScreen.tsx` is 435 lines.
- Added hook tests for fresh and expired cache behavior, malformed-cache fallback, selected split resolution, Firestore failure, and cancellation after unmount.

### Dashboard notice dismissal state

- Moved per-user persisted home-notice dismissal loading and optimistic writes into `useHomeNoticeDismissals.ts`. It preserves the existing AsyncStorage keys, validation, reset behavior, logging, and cancellation of stale account loads. The Dashboard screen is now 380 lines.
- Added hook tests for signed-in/signed-out state, account changes during loading, malformed and failed reads, all supported dismissals, and failed writes.

### Progress maintenance switch

- Moved the maintenance-phase confirmation and save lifecycle into `useMaintenanceSwitch.ts`, preserving the confirmation text/buttons, profile/auth uid fallback, progress error logging and alert, refresh behavior, and busy-state guard.
- Added hook tests for cancellation, successful writes, auth uid fallback, failure reporting, missing recap data, and duplicate confirmation prevention.

### Progress planned workout count

- Moved focus-scoped split loading, active-split selection, and workouts-per-week derivation into `usePlannedWorkouts.ts`; the screen continues to pass the result to its existing progress model.
- Preserved empty, fallback, failure-logging, and stale-request cancellation behavior. Added tests for split resolution, null results, fetch failures, and cancellation.

### Dependency audit remediation

- Updated Expo SDK 54 to `54.0.37` and the matching `jest-expo` preset to `54.0.18`.
- Added compatible overrides for `@grpc/grpc-js`, `undici`, `postcss`, `decode-uri-component`, the vulnerable `@xmldom/xmldom` nested under `react-native-health`, and `image-size@2.0.4`.
- Scoped `uuid@11.1.1` under `xcode`; the Expo `xcode` consumer only calls `uuid.v4()`, which remains exported. This resolved the UUID bounds-check advisory without an Expo-wide upgrade.
- Patched Metro 0.83.1 and Expo's nested Metro 0.83.3 to adapt `image-size@2` exports and pass image bytes to the parser. This resolves the image-size advisories without upgrading Metro; Android export validates the adapted asset pipeline.
- The full audit decreased from 84 findings (55 high, 29 moderate) to 53 (47 high, 6 moderate), with zero critical findings. The production dependency graph reports 28 (22 high, 6 moderate), also with zero criticals.
- Remaining distinct upstream/tooling findings are `node-forge`, `braces`, and `sprintf-js`; many audit rows are affected dependency paths, not separate vulnerabilities. The registry has no patched releases newer than `node-forge@1.4.0`, `braces@3.0.3`, or `sprintf-js@1.1.3`. Expo's node-forge use is in Node-based code-signing/configuration that reads local project PEM files, not an app-runtime path found in this review. The braces finding propagates through toolchain glob matching. Jest 30 contains fixes for some toolchain advisories, but `jest-expo@54.0.18` depends on Jest 29 internals and `jest-watch-typeahead@2.2.1` declares Jest 29 as its highest supported major; do not force an unaligned major upgrade. No safe compatible upstream fixes were available for the remaining findings at review time; recheck before release and when upstream updates land.

### Nutrition data research and verified updates

- Added `scripts/research-nutrients.mjs` to query only `non_barcoded_products`, search product names in Romanian and English through Open Food Facts Search-a-licious, compare candidates with existing macros, and write a review-only JSON report. It never updates Supabase.
- The 25-row dairy pilot found 7 rows with no candidate and 18 requiring manual review; zero met the exact-name, brand, and macro-agreement gate. Do not import Open Food Facts values until ODbL attribution and share-alike terms are reviewed for the shared database.
- Applied 40 source-backed nutrient-field updates across 31 non-barcoded dairy products. The latest additions include saturated fat for Alba 0% kefir and fiber for Albalact 0.1% cow cheese, both with exact macro agreement. The latest batch added saturated fat for five Albalact products from official Albalact labels (25% sour cream, 3.5% milk, 12% and 18% sour cream, and 40% butter). Every write targeted a known row ID and a field that was null. Source/value/match notes are recorded in `verified-nutrient-updates.csv` in the current task outputs. Barcode products were not queried or changed.
- Post-update counts for `non_barcoded_products` (21,054 rows): fiber missing 13,421; sugar missing 5,788; salt missing 5,722; saturated fats missing 21,031. This batch is a start, not full database completion.
- USDA FoodData Central is a potential scalable source for generic foods: USDA describes the data as public domain under CC0 1.0 and asks users to cite FoodData Central. The April 2026 Foundation Foods archive is small; branded-data downloads are much larger. Direct archive downloads failed in this environment, so no USDA data was imported.

Latest validation for the nutrient data work:

- `node --input-type=module --check -` with the research script piped on stdin: passed.
- One-row smoke run and 25-row dairy pilot completed; the pilot made no database writes.
- The 40 live database values were verified with read-back queries. The provenance CSV parses as 40 rows grouped by field: 11 fiber, 3 sugar, 3 salt, and 23 saturated-fat values.
- `git diff --check`: passed.

Next data candidate: retrieve the official USDA Foundation Foods archive and build a review-only matcher for generic products. Keep branded products on a separate source path and check exact product/macro agreement before writes.
Previous validation for the Workout History card projection:

- `npx jest --runInBand --ci`: 126 suites / 1,044 tests passed.
- `npx jest --runInBand --ci src/features/workout/screens/WorkoutHistoryScreen`: 4 suites / 9 tests passed.
- `npx tsc --noEmit`: passed.
- `npx expo export --platform android --output-dir <temporary directory>`: succeeded; this verifies bundling only, not device behavior.
- `git diff --check`: passed.

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

1. **FoodContext:** meal writes, step flushing, cache-then-fresh initialization loading, selected-date orchestration, auth callback sequencing, background evaluations, and account reset are extracted and tested. Avoid broadening into the separate Nutrition audit.
2. **Profile follow-ups:** the Profile form/save and onboarding plan-confirmation lifecycles are isolated and tested. `OnboardingFlow` and `OnboardingStepScreen` were inspected; their current orchestration/presentation split has no additional cohesive seam.
3. **Dashboard follow-ups:** weekly overview, scheduled-workout loading, and notice dismissal state are isolated and tested. The remaining Dashboard view composition was inspected; its active-workout, scheduled-workout, and nutrition cards are already distinct components. Avoid further splits unless a new responsibility emerges.
4. **Progress follow-ups:** screen model, maintenance-phase switch, focused planned-workout loading, and chart sizing are isolated and tested. Remaining screen content is presentation and model wiring; avoid splitting presentational fragments without a cohesive state or behavior boundary.
5. **Workout follow-ups:** `WorkoutService` template-to-session mapping and in-memory exercise updates, workout completion payload projection, template-name policy, exercise image prefetch, split schedule hydration/sanitization, `CreateSplitScreen` preview statistics and editing transitions, `ExerciseSelectionScreen` catalog modeling/loading, `CreateTemplateScreen` selection and list updates, `ExerciseItem` swipe intent, `WorkoutHistoryScreen` grouping/payload/date labels/card projection, `CreateSplitScreen` review summaries, WorkoutDetails card stats, WorkoutScreen preview summaries/scheduled-day mapping and deterministic WorkoutTemplateLibrary keys are covered by tests. Any further extraction should begin with inspection and characterization; do not refactor solely for file size.
6. **Maintenance pass:** reconcile directly related docs and test discovery after each batch. Do not start a broad rewrite, add a new lint framework, or reformat unrelated code.

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
