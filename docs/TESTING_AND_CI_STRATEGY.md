# Testing and CI/CD strategy

## Purpose

Build confidence in user-visible workflows and high-risk data behavior without chasing 100% coverage for its own sake. Prioritize regressions that can lose user data, cross account boundaries, report success when a save failed, or make a core workflow unusable.

This is a staged proposal, not a claim that the proposed tooling is already installed.

## Current baseline

- Jest is the unit-test runner. `jest.config.js` explicitly includes tests under selected `src/features` and `src/shared` folders.
- GitHub Actions runs `npm test -- --ci --coverage` and `npx tsc --noEmit` on pushes and pull requests targeting `master` in `.github/workflows/tests.yml`.
- EAS has `development`, `preview`, and `production` build profiles in `eas.json`.
- There is no configured lint script, React Native component-test setup, or mobile end-to-end suite in the existing package/workflow configuration.
- The current local run (`npm test -- --ci --coverage`, 2026-10-16) passed 52 suites and 615 tests. Coverage for the configured `src/**/*.{js,ts}` scope was 67.63% lines, 61.44% branches, 67.04% functions, and 67.67% statements. `.tsx` screens/components are not instrumented; this is not whole-app coverage. CI reports this coverage and uploads the report as an artifact; it does not enforce a threshold.

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

Consider adding React Native Testing Library only after checking compatibility with the installed React Native, Expo, Jest, and Babel versions. Pilot on one critical, self-contained screen before expanding.

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
- Coverage includes configured JavaScript and TypeScript source files, excluding tests, declarations, styles, and type-only files. It does not instrument `.tsx`.
- No coverage threshold is enforced; do not fail PRs for existing uncovered code.
- Add a modest threshold only after a stable baseline exists; enforce changed/high-risk code or prevent coverage from falling, rather than requiring a sudden repo-wide percentage jump.
- Add linting only after the team chooses and configures a lint tool and cleans or scopes baseline findings; do not add a failing `npm run lint` placeholder.

### Phase 2 — component tests

- Add a compatible React Native Testing Library setup as a separate, reviewed dependency change.
- Pilot a single Nutrition error/retry journey and one save flow.
- Run component tests in the existing Jest job.

### Phase 3 — mobile E2E and preview builds

- Add a manual or scheduled E2E workflow first; do not make flaky device infrastructure a required PR check until stable.
- Build an Android preview/development artifact using EAS only with repository secrets configured and least privilege.
- Run Maestro against an emulator/device or an approved device service; upload logs/screenshots on failure.
- Promote the stable, short smoke suite to a required check after repeated reliable runs.

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
2. Pilot component interaction tests for a user-visible error/retry or save flow.
3. Pilot a small Maestro journey on a development build.
4. Consider a modest changed-code or non-regression coverage threshold after a stable baseline exists.
5. Add approved EAS preview automation; consider production automation only after preview checks are reliable and release approvals are explicit.

At each step, keep the change small, run the targeted test first, then the full Jest suite and `npx tsc --noEmit`. Do not commit or push unless explicitly requested.
