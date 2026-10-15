# Prompt for Claude: Continue the Uptrack app-flow audit

You are continuing a code-level bug audit of the Uptrack Expo / React Native app. Work in the existing repository and make fixes directly in the repo; do not create patch files. The goal is to find and fix confirmed bugs across user flows, add focused regression tests for each fix wherever the test setup permits, validate the changes, and keep the handoff accurate.

## Start here

1. Read `AGENTS.md` for the repository architecture, conventions, test commands, date rules, and security/data ownership guidance.
2. Read `docs/APP_FLOW_AUDIT_HANDOFF.md` for the history of prior audit work, confirmed fixes, validation results, product decisions, and remaining audit sequence.
3. Read relevant sections of `audit/FINDINGS.md` and `audit/PLAN.md` before working on an item they describe. These audit notes may contain stale filenames or line numbers; verify every claim against current code.
4. Inspect `git status --short`, the current branch, and recent commits before editing. The worktree may contain many accumulated uncommitted changes. Preserve all changes you did not make; never reset, checkout, or overwrite them.
5. First review the recent audit changes in Git (the current uncommitted diff, or the audit commits if they have already been committed). Look for correctness regressions and missing test coverage, report concrete findings, and fix confirmed issues before continuing the broader audit.

## Current project context

- Uptrack tracks nutrition, weight, and workouts. Firebase stores user data; Supabase contains shared food data.
- The app uses Expo SDK 54, React Native 0.81.5, React 19.1, Firebase JS SDK, Supabase JS v2, Jest 29, and TypeScript ~5.9. Much of the UI is TypeScript/JavaScript.
- The app has one React Navigation native stack. Confirm route registration in `App.tsx` before adding navigation.
- Firestore reads/writes must remain scoped to the authenticated user. Newly introduced per-user AsyncStorage keys must include the uid or be cleared on sign-out.
- Day keys are local `YYYY-MM-DD`. Use `src/features/nutrition/utils/dateUtils.ts`; never use `toISOString()` to make a day key or parse a date-only string with `new Date()`.
- Jest runs only directories listed by `testMatch` in `jest.config.js`. Add a directory there if a new test otherwise would not run.
- There is no component/navigation test harness. State clearly when UI behavior is code-reviewed/bundle-checked but not exercised on a device.

## Work already covered

The handoff contains the fuller file-by-file history. At a high level:

- Workout received a broad pass over active-workout restoration and account switching, set validation/editing, completion/exit, exercise identity and selection, workout history, templates, splits, and navigation. Regression tests were added for service, handler, and utility behavior.
- Progress calculations and screens received fixes and regression tests.
- Nutrition received fixes around local date/DST handling, meal writes and rollback, account-scoped async results, food-search races/errors, cache validation, barcode request overlap, step retries, weight data races, strict numeric validation, and meal-item memoization.
- Auth state listener and refresh requests now guard against stale user results.
- Profile saves distinguish Firestore save success from refresh failure.
- Dashboard validates persisted dismissals, ignores stale dismissal loads after uid changes, and does not display a schedule-fetch failure as a rest day.
- `docs/APP_FLOW_AUDIT_HANDOFF.md` records exact recent validation. Do not treat it as proof that all possible bugs have been eliminated.

The most recent known validation before compaction was:

- `npx jest --runInBand`: 48 suites / 565 tests passed.
- `$env:TZ = 'America/Los_Angeles'; npx jest --runInBand`: 48 suites / 565 tests passed.
- `npx tsc --noEmit`: passed.
- `npx expo export --platform android --output-dir <temporary directory>`: passed; temporary export output was cleaned up.
- `git diff --check`: passed.

Rerun the necessary checks after your edits. Do not rely on these previous results for new changes.

## Audit status and next work

The app-flow audit is ongoing. Continue looking for reproducible defects, especially in remaining Nutrition flows: daily totals, cache/account transitions, meal add/edit/delete failure cases, custom-food/barcode writes, weight display/history, step persistence, and weekly evaluation. Also inspect other modules and cross-module interactions as evidence warrants.

Before changing weekly evaluation timing/behavior, read the decision notes in `audit/PLAN.md` and ask the owner if the behavior requires a product decision. Do not change serving-unit conversion semantics without owner confirmation; the intended quantity and nutrient scaling are a product decision. Reconfirm other audit-plan candidates in the current implementation before changing them.

Do not claim the audit is complete or that “everything is fixed.” Report what was actually inspected, what was fixed, what remains uncertain, and which user/device/product decisions are outstanding.

## Working method

For each suspected issue:

1. Trace the actual user flow from UI/navigation through context/helper/service and persistence. Confirm the bug in current code before editing.
2. Check empty, malformed, boundary, duplicate, stale-request, failed-write, retry, and account-switch cases where relevant.
3. Fix the root cause with a surgical change that follows existing patterns. Avoid unrelated refactors or style churn.
4. Add a focused regression test in a directory that Jest actually runs. Prefer pure/helper/service tests because there is no UI harness.
5. Validate the exact behavior changed. Run focused tests first, then the full configured Jest suite as warranted, TypeScript, `git diff --check`, and Android Expo export if imports/screens changed. Repeat date-related tests in `America/Los_Angeles`.
6. Update `docs/APP_FLOW_AUDIT_HANDOFF.md` with the new finding, fix, test, and exact validation result when the audit pass is ready to hand off.

Follow all `AGENTS.md` conventions, including not printing environment values. Never include credentials or environment values in logs, documentation, prompts, or commits.

## Git and delivery

- Do not commit or push unless the owner explicitly asks.
- Before any commit, inspect the staged diff and ensure each commit is a coherent logical unit with its related tests.
- Do not assume previously suggested commit commands were run. Inspect Git state first.
- If asked to create a commit, use a concise message that matches the repository's style.
- Do not open a PR or push unless explicitly requested.
- If the owner is using Git Bash on Windows, use forward-slash Git paths (for example, `git add App.tsx src/features/workout/`) rather than PowerShell-style backslash paths.

At the end of your work, summarize confirmed findings/fixes, list files or flows touched with links, report exact test/build commands and outcomes, identify device-only coverage limitations, and give the next concrete audit steps. Keep the handoff updated.
