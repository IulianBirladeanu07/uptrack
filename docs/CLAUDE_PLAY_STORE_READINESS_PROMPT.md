# Claude prompt: continue Play Store release readiness

Copy and paste the prompt below into a fresh Claude session with the Uptrack repository open. It asks Claude to verify the repository and proceed in a limited, safe milestone; it does not authorize publishing or cloud builds.

```text
You are continuing release-readiness work for Uptrack, a React Native / Expo fitness and nutrition tracking app. Work in the existing repository and complete one safe, verifiable milestone. Do not merely provide a generic checklist.

Read first:
- docs/PLAY_STORE_RELEASE_READINESS.md
- docs/TESTING_AND_CI_STRATEGY.md
- app.config.js
- eas.json
- .gitignore
- .github/workflows/tests.yml
- relevant repository instructions (AGENTS.md, if present)

Then inspect `git status`, branch, and recent commits. Preserve all pre-existing work. As of the handoff, HEAD was `cd92040` (`Publish informational Jest coverage in CI`) and `origin/master` matched it. Commits `ce929c2` (weight save snapshot failure isolation) and `cd92040` (CI coverage reporting) are already present. The root files `0001-weight-save-failure-isolation.patch` and `0002-ci-coverage-summary-artifact.patch` are untracked patch copies of already-committed work: DO NOT apply, stage, delete, or include them in your changes.

Known facts to verify in the current checkout:
- `eas.json` production now explicitly has `android.buildType: "app-bundle"`; development/preview remain APKs. Profiles select the matching EAS environments; literal profile-local `${NAME}` placeholders were removed because they override server values.
- `app.config.js` has app version 2.0.5, Android versionCode 3, compile/target API 36, minSdkVersion 26, `allowBackup: false`, blocks `RECORD_AUDIO`, declares CAMERA plus `android.permission.health.READ_STEPS`, and configures `expo-system-ui`.
- `android/` and `ios/` are ignored/untracked, and no `.easignore` exists; EAS uses `.gitignore` and runs Prebuild when native directories are excluded. Isolated local Prebuild verified API 36, version, backup, Health Connect permission, and microphone removal-directive settings. The final release artifact remains unverified; do not treat the stale local Android tree as authoritative or hand-edit it.
- Last directly measured local Jest run (2026-10-16): `npm test -- --ci --coverage` passed 52 suites and 615 tests; configured `src/**/*.{js,ts}` coverage: 67.63% lines, 61.44% branches, 67.04% functions, 67.67% statements. `.tsx` is excluded.
- `npx tsc --noEmit`, `npx expo install --check`, `git diff --check`, static Android/EAS config assertions, and `npx expo export --platform android` passed locally. The export verifies the Metro bundle only, not a native release build or signed AAB.
- The latest `npm audit --omit=dev` reported 65 total production-graph advisories (33 high, 32 moderate, 0 critical); the full graph reported 87 (55 high, 32 moderate, 0 critical). Do not apply forced major upgrades; triage and plan compatible Expo/React Native/Firebase updates.
- Current official Play policy (verify before relying on it): for new apps and updates from Aug 31, 2026, target API 36+; personal Play developer accounts created after Nov 13, 2023 require at least 12 testers continuously opted into closed testing for at least 14 days before applying for production access. The app's Play listing status, account type/date, and any extension are unknown.

Safety and scope:
1. First perform a read-only audit and report findings with evidence: confirmed blocker / needs owner confirmation / recommendation. Keep policy claims linked to current official sources. Do not infer policy compliance from source code.
2. Focus this milestone on verifying Android release readiness and EAS environment setup. Production now builds an AAB; development/preview still build APKs. Do not revert those settings without new evidence.
3. EAS CLI listing confirmed all 15 required variable names in each project environment. Values were not inspected, and the file-variable types/content for `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST` are unverified. Verify only metadata/status without revealing values; do not trigger a cloud build.
4. API 36 is configured and verified in isolated Prebuild, but no release artifact exists here. Do not claim merged-manifest, signing, or artifact verification without evidence. If no artifact exists, state what remains and the safest validation path.
5. If another narrow, code-only correction is unambiguous from official docs and repository evidence, make only that correction, add/update the smallest relevant validation if appropriate, and run the narrow validation plus `npx tsc --noEmit` and `git diff --check`. Add dependencies only when the selected milestone needs them and explain why. If a required decision depends on unknown Play listing/account status or external credentials, do not guess; leave that item as an explicit owner question and avoid a speculative change.
6. Do not alter backend rules/data, create or modify Play Console settings, change signing credentials, commit, push, publish, submit, deploy, upload source to an external service, or run a paid/remote build. No production or store side effects.
7. Update `docs/PLAY_STORE_RELEASE_READINESS.md` only with verified findings and clearly mark owner-only tasks. Keep unrelated files and existing untracked patch copies untouched.

Finish with:
- exact verified findings and evidence, including what remains unknown;
- files changed and why;
- commands/tests run with exact results;
- specific owner decisions/manual device or Play Console tasks still required;
- confirm no build, submission, commit, or push was triggered.
```
