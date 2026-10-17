# Android UI automation

## Current automated smoke test

Maestro runs `.maestro/flows/auth-form-validation.yaml` against an Android API 36 emulator. It launches a clean install, opens Registration and Forgot Password, submits each empty form, verifies the client-side validation messages, and returns to Login.

This first flow is intentionally non-destructive: it does not sign in, create an account, send a password-reset request, or write backend data. Stable React Native `testID`s are used for navigation and submit controls.

## Run in GitHub Actions

1. Commit and push the flow, selectors, and `.github/workflows/android-ui-smoke.yml`.
2. Build a fresh preview APK from that commit using **Actions → Android preview build**. The current existing APK predates the test IDs, so it cannot run this flow.
3. Open **Actions → Android UI smoke → Run workflow**. Leave the optional build ID blank to automatically select the latest finished Android `preview` build for the selected commit. You can provide a UUID or Expo build URL to override this, then check `confirm_ui_test`.
4. The workflow uses `EXPO_TOKEN` from the `eas-preview` environment to resolve and download that existing APK, installs Maestro 2.11.0, runs the flow on an API 36 emulator, and uploads the JUnit report as a 14-day artifact.

The UI smoke workflow does not start a new EAS build and does not use Maestro Cloud. Automatic selection is restricted to a finished Android `preview` build associated with the same Git commit, so dispatch **Android preview build** once for a new commit before running the smoke test. The workflow and EAS token are restricted to a manually requested run. A fresh preview build still uses EAS build quota.

## Safe expansion plan

Only add authenticated, data-mutating journeys after the app's preview EAS environment is confirmed to use a non-production backend and dedicated test accounts. Store credentials as GitHub environment secrets, never in Maestro YAML or workflow inputs. Ensure each flow cleans up its own test records and cannot target real user accounts.

Then expand in small steps:

1. Sign in to a dedicated test account and verify sign-out/session recovery.
2. Search and log a deterministic food, verify totals and persistence, then remove the test entry.
3. Save/edit a fictional weight value and a disposable workout; verify persistence and cleanup.
4. Exercise offline/retry with a controllable test backend or emulator network; avoid unstable internet toggling as a required CI check.
5. Add permission, Health Connect, camera, accessibility, and Play internal-track checks only where the emulator/system setup can produce reliable evidence. Keep physical-device verification for OEM and Play-signing behavior.

## Current boundary

This smoke test validates basic native launch and local form/navigation behavior only. It does not prove Firebase/Supabase access, account isolation, food/weight/workout persistence, real Health Connect data, camera scanning, keyboard/TalkBack behavior, or Play App Signing. Continue using [the manual device flow](./ANDROID_DEVICE_TEST_FLOW.md) for those checks.
