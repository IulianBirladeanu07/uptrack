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

Then inspect `git status`, branch, and recent commits. Preserve all pre-existing work. At the current continuation, HEAD was `3791f30` (`Run CI in three time zones and bundle the Android app`). Existing untracked patch files include `0001-weight-save-failure-isolation.patch`, `0002-ci-coverage-summary-artifact.patch`, `0008-Block-unused-default-Android-permissions.patch`, `0009-Record-verified-release-evidence-in-the-Play-readiness-doc.patch`, `0014-pick-selfie-without-media-library-permission.patch`, `0015-raise-android-min-sdk-to-30.patch`, and `0016-ci-time-zone-matrix-and-android-bundle.patch`. Do not apply, stage, delete, or include those copies.

Known facts to verify in the current checkout:
- `eas.json` production now explicitly has `android.buildType: "app-bundle"`; development/preview remain APKs. Profiles select the matching EAS environments; literal profile-local `${NAME}` placeholders were removed because they override server values.
- `app.config.js` has app version 2.0.5, Android versionCode 3, compile/target API 36, minSdkVersion 30 (Android 11, chosen to cover Galaxy S21 and newer), `allowBackup: false`, blocks `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, and `WRITE_EXTERNAL_STORAGE`, declares CAMERA plus `android.permission.health.READ_STEPS`, and configures `expo-system-ui`.
- `android/` and `ios/` are ignored/untracked, and no `.easignore` exists; EAS uses `.gitignore` and runs Prebuild when native directories are excluded. Isolated local Prebuild verified API 36, version, backup, Health Connect permission, and microphone removal-directive settings. The final release artifact remains unverified; do not treat the stale local Android tree as authoritative or hand-edit it.
- Last directly measured local Jest run (2026-10-16): `npm test -- --ci --coverage` passed 54 suites and 627 tests; configured `src/**/*.{js,ts}` coverage: 68.37% lines, 61.47% branches, 67.15% functions, 68.30% statements. `.tsx` is excluded.
- `npx tsc --noEmit`, `npx expo install --check`, `git diff --check`, static Android/EAS config assertions, and `npx expo export --platform android` passed locally. The export verifies the Metro bundle only, not a native release build or signed AAB.
- Firestore and Storage rules are kept in `firebase/`; `npm run test:rules` passed six emulator tests locally. Push CI passed on GitHub for commits `71a800a` and `72d643d`, including Firebase emulator tests; the weekly informational production dependency audit has not yet run. `.npmrc` sets `legacy-peer-deps=true` so EAS clean installs follow the same peer-resolution behavior used in CI.
- A Nutrition initialization error/retry screen test now runs through React Native Testing Library with the `jest-expo` preset; `src/**/*.tsx` remains excluded from configured coverage.
- `.github/workflows/eas-preview.yml` is manual-only and guarded by a confirmation checkbox and the `eas-preview` environment secret `EXPO_TOKEN`. The first dispatch on `71a800a` failed at remote dependency installation; after adding root `.npmrc` with `legacy-peer-deps=true`, preview build #2 on `72d643d` succeeded. `.github/workflows/android-ui-smoke.yml` can download a specified EAS build and run the non-destructive auth-form Maestro flow on an API 36 emulator.
- The latest `npm audit --omit=dev` reported 65 total production-graph advisories (33 high, 32 moderate, 0 critical); the full graph reported 91 (59 high, 32 moderate, 0 critical). Do not apply forced major upgrades; triage and plan compatible Expo/React Native/Firebase updates.
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
