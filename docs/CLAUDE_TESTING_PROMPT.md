# Claude Sonnet 5.5 prompt: improve testing safely

Select **Claude Sonnet 5.5** in Claude before pasting this prompt. This is a reusable copy-paste prompt; it is not an automatically invoked Claude Code command.

```text
You are working in the Uptrack React Native / Expo repository. Improve automated testing and CI confidence in small, risk-based increments. Do not chase 100% coverage as a goal.

Start by reading:
- docs/TESTING_AND_CI_STRATEGY.md
- .github/workflows/tests.yml
- jest.config.js
- package.json and eas.json
- relevant AGENTS.md / repository instructions

Then inspect `git status` and the current diff. Preserve all pre-existing user changes. Do not reset, checkout, revert, amend, commit, push, deploy, submit an app, change backend rules, or modify production data/settings.

Repository facts to verify rather than assume:
- Jest currently runs on GitHub Actions with `npm test -- --ci`, followed by `npx tsc --noEmit`.
- EAS has development, preview, and production profiles.
- Existing Jest test discovery is explicitly scoped in jest.config.js and currently centers on `.js`/`.ts`; a TypeScript-only coverage number is not whole-app coverage.
- Check which test/UI/E2E/lint dependencies are actually installed before proposing or using them.

For this run, choose exactly ONE next high-risk workflow or CI milestone that is not already adequately covered. Prefer data isolation, persistence, failure/retry/recovery, or a realistic user journey. If the user supplied a target, use that. Otherwise inspect current per-file coverage and tests, explain the chosen target briefly, and proceed.

Execution rules:
1. Trace the behavior from the user-visible entry point through service/state/persistence before editing.
2. Identify the contract and realistic failure cases; do not write tests that only mirror implementation details.
3. Add the smallest useful focused tests, reusing existing project patterns and mocks. Add dependencies only if the selected milestone requires them and explain why first.
4. If tests reveal a real defect, make a surgical fix and add a regression test. Do not broaden scope to unrelated cleanup.
5. For UI simulation, distinguish JS component tests from real device behavior. Do not claim that Jest proves native permissions, camera, Health Connect/HealthKit, Google sign-in, or platform-specific behavior.
6. For CI/CD, prefer PR checks and artifact reporting first. Do not add production build/submission/deployment automation without explicit approval and configured protected secrets/environments. Avoid making unstable emulator/E2E tests required before they are reliable.
7. Run the narrow test, then the full relevant Jest suite and `npx tsc --noEmit`; run `git diff --check`. Report exact results and any limitations.
8. Keep the final diff scoped to the chosen milestone. Update docs/TESTING_AND_CI_STRATEGY.md only if the recommendation or milestone status materially changes.

Finish with:
- What workflow/milestone was selected and why.
- Files changed and behavior covered.
- Tests/commands and exact outcomes.
- Updated coverage only if measured, specifying included file types and exclusions.
- Remaining device/CI/manual checks.
- Any dependencies added or blockers.
Do not claim the entire test strategy is complete after one milestone.
```
