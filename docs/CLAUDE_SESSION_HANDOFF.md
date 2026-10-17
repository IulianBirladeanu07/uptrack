# Claude session handoff

Updated 2026-10-17. Start with this handoff, then read `AGENTS.md` before changing code.

## Repository snapshot

- Repository: `IulianBirladeanu07/uptrack`
- Branch: `master`
- Snapshot commit: `450b4e3 refactor: extract exercise selection data`
- At handoff creation, `master` was clean and matched `origin/master`.
- This is an inventory-based repository review, not a claim that every source file received a line-by-line bug audit.

## How to continue

The owner's recent workflow has been one small, behavior-preserving refactor at a time. The owner reviews, commits, and pushes each batch; do not commit or push unless explicitly asked. If commit commands are requested, omit a `Co-authored-by` trailer.

Before each batch:

1. Check `git status --short --branch` and recent commits. Preserve any changes that are not yours.
2. Read `AGENTS.md`, then inspect the target and its callers/tests. Read `docs/APP_FLOW_AUDIT_HANDOFF.md` and the relevant `audit/` notes if the work concerns correctness or user flows.
3. Make a focused change, preserve user-visible behavior, add tests for extracted logic or confirmed defects, and update directly related docs.
4. Run focused tests, `npx tsc --noEmit`, and `git diff --check`. Run the full Jest suite for a coherent batch. Use Android Expo export for screen/import changes when appropriate; test date logic in `America/Los_Angeles`; run `npm run test:rules` for Firestore rules/access changes.
5. Report what was actually verified. Jest does not provide component/navigation or device-level coverage; do not describe a bundle export or helper test as an end-to-end UI test.

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

### Exercise selection (latest batch)

- Moved catalog enrichment, identity-keyed lookup/count construction, filtering/grouping, and FlatList row generation into `src/features/workout/screens/ExerciseSelectionScreen/exerciseSelectionData.ts`.
- Integrated those helpers into `ExerciseSelectionScreen.tsx`; added seven tests and Jest discovery for this screen directory.
- Preserved filtering fields/order, identity keys, list IDs, and the existing count behavior for repeated group entries.

The latest validation after this batch was:

- `npm test -- --runInBand`: 88 suites / 776 tests passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- No Android export was run specifically for the latest batch.

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

1. **Workout component layer:** inspect `src/features/workout/components/ExerciseItem/ExerciseItem.tsx` (about 785 lines in the inventory) and its child components/hooks. Extract a cohesive presentation or interaction responsibility at a time, with colocated pure-logic tests where useful.
2. **Workout authoring flows:** inspect `CreateExerciseScreen` (about 595 lines) and `CreateTemplateScreen` (about 485 lines). Keep validation, persistence, and navigation behavior unchanged; first look for existing shared form helpers and tests.
3. **Nutrition UI/data boundaries:** inspect `FoodSearchResults.tsx` (about 594 lines), then `FoodContext.tsx` (about 624 lines). This area has account-scoped async state, caching, rollback, and date semantics; avoid moving logic without tracing its callers and failure paths. Coordinate with the open Nutrition audit rather than duplicating it.
4. **Other large screens:** review `DashboardScreen` (about 658 lines), `ProgressScreen` (about 669 lines), and Profile screens for discrete view-model/presentation responsibilities. Prefer the smallest seam with strong behavior tests.
5. **Maintenance pass:** once a feature batch is complete, reconcile directly related docs and test discovery. Do not start a broad rewrite, add a new lint framework, or reformat unrelated code.

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
