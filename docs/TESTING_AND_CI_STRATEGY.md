# Testing and CI/CD strategy

## Purpose

Build confidence in user-visible workflows and high-risk data behavior. Pursue comprehensive coverage through meaningful behavioral tests, prioritizing regressions that can lose user data, cross account boundaries, report success when a save failed, or make a core workflow unusable; do not add assertions solely to inflate a percentage.

This strategy is being implemented in stages. The baseline identifies the checks configured now; the roadmap distinguishes completed work from proposed work.

## Current baseline

- Jest is the unit-test runner. `jest.config.js` includes tests under selected `src/features` folders and shared Firestore, service, and utility folders.
- Firebase Firestore and Storage security rules are tested against local emulators with `npm run test:rules`; Supabase RLS remains untested in an emulator and needs a dedicated non-production Supabase project for integration tests.
- GitHub Actions runs Jest in three time zones (UTC, America/Los_Angeles and Europe/Bucharest, so day-key bugs on both sides of UTC fail CI; coverage is collected in the UTC run only), `npx tsc --noEmit`, `npx expo export --platform android`, and Firebase emulator security-rule tests on pushes and pull requests targeting `master`. A weekly schedule runs the same checks plus an informational production dependency audit; it does not build or deploy a native app.
- EAS has `development`, `preview`, and `production` build profiles in `eas.json`. Android preview build #2 succeeded on `72d643d`; it produced an APK for manual device testing.
- There is no configured lint script or mobile end-to-end suite. React Native Testing Library and the Expo Jest preset are configured, with one Nutrition initialization error/retry screen journey.
- The current local run (`npx jest --runInBand --ci --coverage`, 2026-10-17) passed 126 suites and 1,044 tests. Coverage instruments `src/**/*.{js,ts,tsx}` (excluding tests, declarations, styles, and type-only files): 49.88% lines, 41.63% branches, 43.73% functions, and 49.80% statements. The earlier 68.37% line figure excluded `.tsx` and is not comparable; CI reports coverage and uploads the artifact but does not enforce a threshold.
- The local Firebase emulator run (`npm run test:rules`) passed all eight Firestore and Storage rule tests. It covers user ownership, meal day IDs and query constraints, workout/profile records, shared exercise reads, profile image ownership/type/size, and public catalog image reads.

## Test pyramid

### 1. Unit tests: deterministic logic

Keep pure helpers small and test their observable contracts:

- Dates, timezone/DST boundaries, weekly aggregation, validation, ranking, and calculations.
- Input edge cases: absent, malformed, duplicate, stale, future-dated, and boundary-value data.
- Error outcomes where a caller must distinguish failure from an empty result.

Use table-driven tests where cases share a contract. Avoid testing implementation details or adding tests solely to execute every line.

### 2. Service and context tests: persistence and async behavior

Mock Firebase, Supabase, AsyncStorage, and native APIs at their boundaries. Verify what is sent, returned, cached, retried, and surfaced to callers.

Prioritize:

- Authenticated-user changes during pending requests; ensure one user's data never reaches another user's state or cache.
- Offline/read/write failures, retries, rollback, and stale response suppression.
- Meal creation/edit/delete and daily totals; cache expiry, malformed persisted records, and Firestore fallback.
- Workout split/template persistence and active-workout ownership.
- Weight cache freshness, snapshots, and evaluation cadence.

Prefer focused service/context tests over broad mocks of entire screens. Tests should fail if data isolation, persisted payloads, or failure semantics regress.

### 3. Component tests: simulate user interaction

The pilot uses React Native Testing Library with the installed React Native, Expo, Jest, and Babel versions. Expand only after the setup remains stable in CI.

Test user-visible contracts rather than component internals:

- Render loading, empty, error, and success states.
- Tap the actual control, enter realistic values, and verify the resulting visible state or navigation intent.
- Cover disabled/invalid submissions, save failures, retries, and duplicate taps.
- Query by accessibility role/label or stable `testID`; add accessible labels where needed.

These tests simulate interaction in a JS test renderer. They do **not** prove native permissions, actual navigation gestures, device keyboard behavior, or backend integration.

### 4. Mobile end-to-end tests: real app journeys

Pilot Maestro (or an alternative selected after a short compatibility check) against a development/preview build. Keep the first flows small and deterministic:

1. Sign in to a dedicated test account, open Nutrition, add a food, and confirm meal/totals update.
2. Simulate a meal-load failure, observe the error/retry UI, restore connectivity, and verify retry recovery.
3. Create/edit a workout template or split, then confirm it persists after navigating away and returning.
4. Change or sign out the account and confirm user-scoped data does not leak.

Use isolated test accounts and seeded/resettable test data. Never point destructive E2E flows at production accounts or production data.

Run native-dependent checks on a device or emulator: Google sign-in, camera/barcode permissions, Health Connect/HealthKit, notification/keyboard behavior, and platform-specific navigation. Screenshots may help with layout review, but screenshot comparisons should account for OS, font scale, and device differences.

## UX workflow simulation checklist

For each important workflow, write the user journey before writing the test:

1. **Starting point:** user state, account state, platform, and required data.
2. **Actions:** the controls the user actually taps/types.
3. **Expected feedback:** visible loading, success, empty, or error state.
4. **Persistence:** what remains after leaving and reopening the screen.
5. **Failure/recovery:** network loss, denied permission, invalid input, retry, or duplicate action.
6. **Isolation:** whether another account or date can observe the result.

Exercise the happy path and at least one meaningful failure/recovery path for each high-risk workflow. Use component tests for most interactions and E2E tests for a small number of representative journeys.

## CI/CD roadmap

### Phase 1 — strengthen existing PR checks (complete)

Keep CI fast and deterministic. The existing workflow already runs Jest and TypeScript.

- CI runs Jest with coverage, adds an informational coverage table to the job summary, and uploads the report for 14 days.
- CI also runs Jest in America/Los_Angeles and Europe/Bucharest, type-checks in its own job, and bundles the Android app with `expo export`. `expo-doctor` is not run in CI: it needs the Expo API, and it currently reports `react-native` 0.81.5 against an expected 0.81.4, which is a deliberate pin with a patch-package patch.
- CI runs Firestore and Storage security-rule tests against emulators using the checked-in rules. A weekly schedule (and manual workflow dispatch) repeats all checks and adds an informational `npm audit --omit=dev` summary. It never builds, deploys, or submits an app.
- Coverage instruments JavaScript, TypeScript, and TSX source files, excluding tests, declarations, styles, and type-only files.
- No coverage threshold is enforced; do not fail PRs for existing uncovered code.
- Add a modest threshold only after a stable baseline exists; enforce changed/high-risk code or prevent coverage from falling, rather than requiring a sudden repo-wide percentage jump.
- Add linting only after the team chooses and configures a lint tool and cleans or scopes baseline findings; do not add a failing `npm run lint` placeholder.

### Phase 2 — component tests

- Added a compatible React Native Testing Library and Expo Jest setup.
- The first pilot covers the Nutrition initialization error, verifies the Retry action, and checks the recovered meal view.
- The screen test is included in the existing Jest job. Expand coverage after the setup remains stable in CI.

### Phase 3 — mobile E2E and preview builds

- Add a manual or scheduled E2E workflow first; do not make flaky device infrastructure a required PR check until stable.
- `.github/workflows/eas-preview.yml` provides a manually dispatched Android preview APK build. It requires the `confirm_preview_build` checkbox and an `EXPO_TOKEN` secret in the `eas-preview` GitHub environment; it was not run as part of this change.
- `.github/workflows/android-ui-smoke.yml` can manually download a specified EAS APK and run a non-destructive Maestro auth-form/navigation flow on an API 36 emulator. It requires the same EAS token and a fresh build ID; it does not sign in or modify backend data. See [Android UI automation](./ANDROID_UI_AUTOMATION.md) for dispatch steps and the safe expansion plan.
- Run Maestro against an emulator/device or an approved device service; upload logs/screenshots on failure.
- Promote the stable, short smoke suite to a required check after repeated reliable runs.

### Build cadence recommendation

- Do not schedule daily or weekly EAS builds or Play releases while the app is pre-launch; those create artifacts without a tester or release need and consume build quota.
- Use the weekly scheduled CI above for drift and time-zone regression detection.
- Build an Android preview APK on demand when a device-testing session is planned, using the gated manual workflow and an owner-managed `EXPO_TOKEN` secret. Each dispatch must be deliberate because EAS build quota may be consumed.
- After a preview build completes, run the separate gated Android UI smoke workflow against that build ID. Downloading an existing APK and running the smoke test does not start a new EAS build.
- Build a production AAB only for a reviewed release candidate. Keep Play upload/submission manual and separately approved; do not make it part of routine CI.

### Phase 4 — release gates

- Keep production builds/submission separate from routine PR CI.
- Require explicit approval for production build/submission, protected environment secrets, and a tagged/reviewed release.
- Never deploy Firestore rules, execute database migrations, or change remote console settings from an unreviewed test workflow.
- Keep rollback/recovery and release ownership documented before automating store submission.

## Success measures

Track whether tests protect workflows, not only how many lines execute:

- Core workflow coverage: at least one happy path and one failure/recovery path per high-risk flow.
- Regression escape rate and time to diagnose failures.
- CI duration and rerun/flakiness rate.
- Coverage trends by high-risk module and changed code; avoid vanity thresholds.
- Device/E2E smoke results across supported platforms.

## Suggested order

1. Preserve and validate current tests and fixes; prioritize uncovered high-risk branches and account/cache boundaries.
2. Expand component interaction tests for another high-risk user-visible save or failure/recovery flow.
3. Pilot a small Maestro journey once the preview build is stable and a dedicated test account/data set is ready.
4. Consider a modest changed-code or non-regression coverage threshold after a stable baseline exists.
5. Add approved EAS preview automation; consider production automation only after preview checks are reliable and release approvals are explicit.

At each step, keep the change small, run the targeted test first, then the full Jest suite and `npx tsc --noEmit`. Do not commit or push unless explicitly requested.
