# Google Play production readiness

**Status:** preparation checklist, not a claim that Uptrack is currently compliant or ready to publish. Policy requirements and Play Console forms can change; verify the official links again when preparing the actual submission. Last researched: 2026-10-16.

## Executive summary

The current repo has useful automated Jest and TypeScript checks, but those alone are not a production release gate. Before a Play submission, verify the actual release artifact, test the critical end-to-end workflows on Android, and complete the Play Console declarations from the app's real data practices.

Two repo-specific items need early attention:

1. `eas.json` now configures the **production Android build type as `app-bundle`**, producing an `.aab`; development and preview profiles remain APKs for direct installation.
2. `app.config.js` now explicitly sets compile and target SDK to API 36, the current minimum for new apps and updates submitted from August 31, 2026 (subject to the stated extension and exceptions). The actual **release artifact** still needs inspection before submission.
3. EAS profiles explicitly select matching remote environments. The former profile-local `${NAME}` strings were literal values that override EAS-hosted values; they have been removed. Required variables and service config files must be configured in EAS before cloud builds.

The Play account type/creation date and whether this app has already been published are not known. The personal-account closed-testing requirement below is conditional.

## What is already in place

- CI runs Jest with coverage and `npx tsc --noEmit` on pushes and pull requests to `master`.
- Push CI passed on GitHub for commits `71a800a` and `72d643d`, including three timezone Jest jobs, TypeScript, Android JS bundling, and Firebase emulator rules. The weekly scheduled dependency audit has not yet run; CI does not test Supabase RLS against a live non-production backend.
- A separate manual Android preview workflow is gated by a confirmation checkbox and the `eas-preview` GitHub environment's `EXPO_TOKEN`. The first dispatch on `71a800a` failed during remote dependency installation; after adding root `.npmrc` with `legacy-peer-deps=true`, preview build #2 on `72d643d` completed successfully and produced an APK. The Android UI smoke workflow can download a specified EAS build and run the non-destructive Maestro auth-form flow on an API 36 emulator. Neither workflow produces a production AAB or submits to Play.
- `jest-expo` and React Native Testing Library are configured, with a Nutrition initialization error/retry journey test. Native permissions, keyboards, and device behavior still require real-device testing.
- The latest local full Jest run on 2026-10-18 passed **128 suites / 1,052 tests** in the default timezone. The latest three-timezone run (2026-10-17) passed **126 suites / 1,044 tests** in UTC, America/Los_Angeles, and Europe/Bucharest, plus **8 Firestore/Storage emulator tests**. The latest measured coverage (2026-10-17) for `src/**/*.{js,ts,tsx}` is **49.88% lines, 41.63% branches, 43.73% functions, and 49.80% statements** (excluding tests, declarations, styles, and type-only files). These are not device or end-to-end coverage results.
- The latest `npx expo export --platform android` on 2026-10-18 successfully bundled the Android JavaScript app. This verifies Metro bundling only; it does not verify a native build, signed AAB, merged manifest, or device behavior.
- EAS has development, preview, and production profiles.
- `app.config.js` sets app version `2.0.5`, Android `versionCode: 3`, compile/target API 36, minimum API 30 (Android 11, chosen to cover Galaxy S21 and newer), `allowBackup: false`, declares camera and Health Connect step-read permissions, and blocks `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`. The last three were Expo default permissions that appeared in the generated manifest; the app's own source does not use them (image picking uses `launchImageLibraryAsync` with no permission request, haptics and `Vibration` need only `VIBRATE`, which stays). `expo-image-picker` 17.0.11 asks for `WRITE_EXTERNAL_STORAGE` before `launchCameraAsync` only on Android below API 29, which the minimum API 30 excludes, so blocking it does not affect the selfie camera or gallery picking. Expo System UI is installed/configured to apply the app's light UI setting natively.
- The account-deletion service and weight-save/snapshot regressions have tests. These do not replace device, store-policy, or backend integration checks.

## OTA runtime compatibility

`app.config.js` uses Expo's `fingerprint` runtime policy. The fingerprint includes native configuration inputs, including the contents of `android.googleServicesFile`; generating an update fingerprint without the same Google services file used for the target native build can produce a runtime that no installed binary matches.

- Before publishing an EAS Update, use the same EAS environment and native configuration/file variables as the build being targeted.
- Generate the platform fingerprint in that environment and compare it with the fingerprint recorded for the intended native build. Do not publish if they differ or if the file variable is unavailable.
- The previous `appVersion` runtime (`2.0.5`) is intentionally isolated from fingerprint-policy updates. Install a compatible native build before expecting those users to receive updates.
- There is currently no repository update workflow enforcing these checks. Do not treat a local Expo config resolution or JS export as proof of OTA compatibility.

## Release blockers to verify first (P0)

### Build and artifact

- [ ] Confirm whether this is a new Play listing or an update to an existing published app; confirm the Play developer account type and creation date.
- [x] Configure the production EAS profile to output an Android App Bundle (`.aab`) for Play distribution. Development and preview remain APK profiles.
- [ ] Build and inspect the exact candidate artifact before submission. Record package ID, version name/code, target and minimum SDK, signing identity, merged permissions, backup behavior, and artifact type. Never infer the release manifest from the workstation's generated native directory.
- [x] Explicitly configure compile/target API 36. Confirm target API and merged permissions in the exact built release artifact; if relying on an extension or exception, verify it in Play Console.
- [ ] Confirm the package ID remains `com.iulianbirladeanu.uptrack`, the version code is greater than any version already uploaded to that Play app, and the signing key / Play App Signing arrangement is understood and backed up.
- [ ] Confirm the release build points at production services, has no development menu or test credentials, and can install/upgrade cleanly. Check the release's network security, crash reporting, and any obfuscation/minification configuration before relying on it.
- [x] Required variable names were found in the Expo project's `development`, `preview`, and `production` project environments (15/15 names each; values were not read). Variable names: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `FIREBASE_STORAGE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DEFAULT_FOOD_ICON_URI`, plus `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST`. Still verify that the last two are EAS file variables and that each environment's content matches its intended backend/app. Do not paste values into source control or chat; any value embedded in the client app must not be treated as a server secret.

**Native-project caveat:** `android/` and `ios/` are ignored and not tracked in Git, and there is no `.easignore`. EAS therefore uses `.gitignore`; Expo documents that EAS runs Prebuild when native directories are excluded. An isolated local Prebuild verified generated Gradle settings for compile/target API 36, version code 3, version name 2.0.5, disabled backup, the Health Connect steps permission, and a removal directive for `RECORD_AUDIO`. The stale local generated tree is non-authoritative. The directive is not proof of the final merged permission set; inspect the actual release artifact before submission. Do not hand-edit ignored generated files as a release fix.

**Generated-manifest evidence (isolated prebuild, not a release artifact).** A prebuild of the current checkout in a throwaway copy produced a main manifest with `CAMERA`, `INTERNET`, `VIBRATE` and `android.permission.health.READ_STEPS`, plus `tools:node="remove"` for `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`; `allowBackup="false"`, `versionCode 3`, `versionName "2.0.5"`, SDK 30/36/36 (min/compile/target, from the generated `gradle.properties`) and `edgeToEdgeEnabled=true`. Library manifests are merged at build time and may add more, so the merged permission list and `uses-feature` entries (for example an implied required `android.hardware.camera`, which would hide the app from devices without a camera) still need checking in the built AAB. The same manifest declares a Health Connect permission-rationale intent filter and a `ViewPermissionUsageActivity` alias that both open `MainActivity`; the app has no dedicated rationale or privacy-policy screen for them to show. It also carries the `exp+uptrack` development-client URL scheme from `expo-dev-client`.

### Google sign-in and Play App Signing

- [ ] Google sign-in checks the app's package name and signing certificate SHA-1 against an Android OAuth client. An app installed from Play is re-signed with the Play App Signing key, so the SHA-1 shown in Play Console (Test and release, App integrity) must be registered as an OAuth Android client in Google Cloud and in the Firebase project, in addition to the EAS upload key and the local debug key. Without it, sign-in is expected to fail with a developer error on builds installed from Play, while sideloaded EAS builds keep working. Verify on an internal-testing install.

### Dependency audit

- [ ] Review and resolve or explicitly mitigate dependency advisories before release. On 2026-10-16, `npm audit --omit=dev` reported **65 total: 33 high, 32 moderate, 0 critical** in the npm production dependency graph; the full dependency graph reported **91 total: 59 high, 32 moderate, 0 critical**. These graphs include framework and build-time packages and do not mean each advisory is exploitable in the shipped app. Most remaining fixes require major-version changes across Expo/React Native/Firebase; do not run `npm audit fix --force` as a blanket fix. Triage advisories, update the compatible stack deliberately, and rerun tests/build validation.

### Source-observed data inventory (not a Data safety declaration)

Verify this against production backend settings, the full SDK list, and legal/privacy owner input before submitting Play Console answers:

- Firebase Authentication supports email/password and Google sign-in.
- Firestore stores user profile/plan data in `users/{uid}` and app-owned nutrition, weight, and workout records in user-scoped collections. Health Connect step history is synced into the user's Firestore record by [stepsSyncService.ts](../src/features/nutrition/helpers/stepsSyncService.ts).
- Firebase Storage stores profile pictures under `profilePictures/{uid}.jpg`.
- Supabase is used for food search and barcode product lookup through [supabaseClient.ts](../src/shared/services/supabaseClient.ts); the repository audit notes a shared food catalogue.
- Health Connect provides step records on Android; HealthKit is configured on iOS. Camera access is declared for barcode scanning.
- The app keeps local cached state in AsyncStorage. The in-app deletion flow attempts to remove the user's Firebase records, profile image, Auth account, and uid-scoped local keys in [accountDeletionService.ts](../src/features/profile/services/accountDeletionService.ts).
- No explicit analytics event API calls were found in the source search, but a Firebase measurement ID is configured. Verify the actual shipped SDK behavior and Firebase settings rather than inferring that no analytics data is collected.

No privacy policy or public web account-deletion page was found in this repository, and no in-app screen or link refers to a privacy policy (source search, 2026-10-16). The in-app delete control does not satisfy the separate public web request-resource requirement by itself. Owner must provide/host both resources and test the public deletion request path.

### Health, privacy, and account deletion

- [ ] Complete the Play Console **Health apps declaration** and choose the feature/data categories that accurately describe the shipped app. Uptrack's activity/steps and nutrition/weight-management features are likely relevant, but the owner must make the final declaration.
- [ ] Give the Health Connect permission-rationale entry points (`androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` and `VIEW_PERMISSION_USAGE`) a screen that explains how step data is used and links to the privacy policy. Today both open the app's normal start screen.
- [ ] Confirm every health permission is necessary for a feature users can access, explain the reason in context, request consent at the appropriate time, and handle denial/revocation gracefully. The final merged manifest should not include unused permissions. In particular, check the actual Health Connect permission list and remove anything not needed.
- [ ] Publish an active, public, non-geofenced privacy-policy URL, and provide the policy in-app. Ensure it accurately covers collection, use, sharing, retention, security, and deletion of account, profile, nutrition, weight, and health/activity data, including data handled by Firebase, Supabase, and other shipped SDKs.
- [ ] Complete the Play **Data safety** and data-deletion declarations using an inventory of app code, backend behavior, and every included SDK. The developer—not Play or the test suite—is responsible for accurate answers.
- [ ] If users can create accounts in-app, verify both an in-app deletion path and a public web resource where users can request account and associated-data deletion. Test the complete deletion flow against a dedicated non-production account, including authentication, app-owned records, related data, and user-visible confirmation.
- [ ] Provide Play reviewers any needed test credentials and reproducible steps to reach authenticated or health-data features. Do not require a reviewer to use a real user's account or device health data.
- [ ] Review health claims, app description, disclosures, and functionality for misleading medical claims. If the product is a general wellness tracker, keep its claims consistent with that; obtain qualified advice if any feature is medical or regulated.

## Risk-based test plan

Run these against the signed **release-candidate** build obtained through Play internal testing when possible. Use dedicated test accounts and non-production data.

| Priority | Workflow | Minimum checks / evidence |
|---|---|---|
| P0 | Install, launch, upgrade | Fresh install; launch while offline; upgrade from the last intended public version; preserve valid user data; confirm package/version and no startup crash. |
| P0 | Authentication and account isolation | Sign up, verify email if required, sign in/out, password reset, expired/invalid credentials, network failure, account switch; prove one account's nutrition, weight, and workout data never appears in another's cache or views. |
| P0 | Nutrition | Search/select food, create/edit/delete a meal, verify units/macros/totals and persistence after restart; cover empty results, malformed data, offline reads/writes, retry, and duplicate taps. |
| P0 | Weight and progress | Save/edit a measurement, navigate weeks including boundary dates, reload/restart, and confirm current profile weight and historical entries remain consistent after a failed write or snapshot. |
| P0 | Workout | Create/edit a plan or workout, log sets, pause/resume/finish, navigate away and return, restart, and verify persistence and ownership. Test interruption/backgrounding and duplicate completion. |
| P0 | Health Connect / steps | Test on a supported physical Android device with no provider, provider unavailable, permission denied, partial/revoked permission, zero steps, and valid data. Verify no data is read before consent and manual tracking remains usable if permission is denied. |
| P0 | Data deletion | Delete a dedicated test account in-app and submit a request through the public web path; verify expected backend records and user data are removed and the deleted account cannot continue using stale cached data. |
| P1 | Failure and recovery | Airplane mode, slow/interrupted network, app background/restore, expired auth, backend timeout, storage pressure; user sees actionable errors and retry recovers without data loss or false success. |
| P1 | Permissions and navigation | Camera/barcode permission allow/deny/permanent denial, Android back/navigation, keyboard and form validation, rotation if supported, font scaling, accessibility labels and TalkBack for core controls. |
| P1 | Device compatibility | At least one physical device on the oldest supported Android API (minimum SDK is 30; an S21-class device on Android 11 to 13 covers it) and current target Android 16/API 36; add a second vendor/device class and tablet only if those form part of the supported experience. Exercise target-SDK behavior changes on API 36, especially edge-to-edge layout and system bars. |
| P1 | Operational quality | Review Play pre-launch report, crashes, ANRs, startup time, app size, battery/network behavior, and any SDK warnings. Triage all release-blocking findings; document accepted lower-severity issues. |

### Test layers and current gaps

- **Unit/service tests:** retain Jest for deterministic calculations, persistence payloads, async races, errors, and cache/account isolation. Keep assertions on observable contracts.
- **Component tests:** consider a single React Native Testing Library pilot for Nutrition load-error/retry or a save failure. This needs a separately reviewed dependency/setup change and still does not prove native APIs.
- **Backend integration:** use a dedicated Firebase/Supabase test project or emulator where feasible for authorization rules, concurrent writes, deletion, and real serialization. Never run destructive tests against production accounts/data.
- **Device tests:** physical Android testing is required for Health Connect, camera/barcode, Google sign-in, keyboard, permission prompts, and release-only behavior.
- **E2E:** pilot a small Maestro journey only after a stable development/preview build and deterministic test account/data exist. Keep flaky device/E2E infrastructure out of required PR checks until reliable.

Current PR CI is useful but not a Play release gate: it does not build the signed production artifact, instrument `.tsx` UI, test native permission/API behavior, or exercise production backend integration. Do not set a repo-wide coverage threshold based on the current partial coverage number.

For a step-by-step physical Android test, use the [Android device test flow](./ANDROID_DEVICE_TEST_FLOW.md). It records setup, expected outcomes, test-account safety, evidence, and no-go criteria; repeat the critical flows on the Play internal-track build before release.

## Play Console and launch checklist (owner tasks)

- [ ] Complete store listing: app name, short/full descriptions, icon, screenshots, feature graphic as required, category, contact/support details, and accurate target-audience/content-rating answers.
- [ ] Add privacy-policy URL and accurately submit App access, Ads, Data safety/data deletion, and Health apps declarations. Confirm all forms are consistent with the shipped app and SDKs.
- [ ] Provide reviewer access instructions and a dedicated test account if needed; ensure any gated features can be reviewed without real health data.
- [ ] Upload the signed AAB to internal testing first. Install from the Play testing track (not only sideloading an APK); test update delivery, Play-generated install, and Play integrity/sign-in flows.
- [ ] Review the Play pre-launch report and fix launch-blocking crashes, policy issues, and permission problems. Keep evidence and build identifiers.
- [ ] If the Play developer account is a **personal account created after November 13, 2023**, run a closed test with at least **12 continuously opted-in testers for at least 14 days**, then apply for production access. This rule is conditional; verify the account's actual Play Console requirements.
- [ ] Choose staged rollout and monitored release ownership. Watch crashes, ANRs, reviews, and support reports; define stop/roll-back criteria and how to halt or roll back a rollout before publishing.
- [ ] Keep signing credentials and production secrets in approved secret storage. Do not put credentials in Git, logs, prompts, test fixtures, or documentation.

## Suggested go/no-go criteria

Do not submit a production release until all P0 artifact/policy items have an owner and evidence, all P0 workflows pass on the release candidate, no unresolved data-loss/account-isolation defects remain, the Play declarations and store listing match actual behavior, and the owner has a tested support/rollback plan. Record explicit acceptance for any remaining P1 issue.

## Official references

Check these again immediately before release:

- [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [Google Play target API policy and dates](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Android App Bundles](https://developer.android.com/guide/app-bundle)
- [Expo: build APKs and configure APK output](https://docs.expo.dev/build-reference/apk/)
- [Expo: configure EAS with eas.json](https://docs.expo.dev/build/eas-json/)
- [Expo: Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Play Console closed-test requirements for newer personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google Play Health apps policy](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google Play App content and reviewer access](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)
