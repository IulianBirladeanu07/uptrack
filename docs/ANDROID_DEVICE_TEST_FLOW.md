# Android device test flow

Use this runbook for the Uptrack preview APK and again for the production candidate from Google Play internal testing. A sideloaded preview is useful for app behavior, but it does not verify Play App Signing, Play installation/update behavior, or Play Console declarations.

The non-destructive auth form/navigation smoke test can also run in GitHub Actions with Maestro using `.github/workflows/android-ui-smoke.yml`. It does not replace the end-to-end checks below.

## Before starting

- [ ] Use a physical Android phone that meets the app's minimum API (Android 11 / API 30 or newer). Record model, Android version/API, and security update date.
- [ ] Install the latest preview APK from the EAS build page. Record the Git commit, EAS build ID, app version, and version code from the build details if available.
- [ ] Use a dedicated test account and non-production data. Do not use a personal account containing real health or nutrition data.
- [ ] Have a second test account available for the isolation check.
- [ ] Ensure you can access the test account's email and password-reset email. Do not record passwords, access tokens, private health information, or other secrets in test notes.
- [ ] Start with a reliable network connection. Keep Android system date/time automatic.
- [ ] Record each check as **PASS**, **FAIL**, **BLOCKED**, or **NOT TESTED**. Capture screenshots only when useful; remove or obscure email addresses, tokens, and personal data before sharing them.

### Test record

| Field | Value |
|---|---|
| Date / tester | |
| Device / Android version and API | |
| Install source (EAS preview / Play internal) | |
| Git commit / EAS build ID | |
| App version / version code | |
| Result | PASS / FAIL / BLOCKED |
| Issues / screenshot references (redacted) | |

## A. Install and launch

1. Install the APK and launch Uptrack.
   - **Expect:** installation completes without a package/signature error; the app opens without a crash, blank screen, or stuck splash screen.
2. Close and reopen the app.
   - **Expect:** the app starts normally and shows the expected signed-out or signed-in state.
3. Open Android App info for Uptrack and inspect its permissions.
   - **Expect:** only permissions needed for the app's features are present. Record unexpected permissions; do not dismiss them as harmless.
4. If upgrading from an earlier test build, install the newer build over it without clearing app data.
   - **Expect:** the upgrade succeeds and existing test-account data remains available.
   - **Note:** this does not replace a Play internal-track upgrade test.

## B. Authentication and account isolation

Use test accounts A and B.

1. Create account A, complete any email verification/onboarding required, and sign in.
   - **Expect:** the account reaches the main app; verification or network errors are clear and recoverable.
2. Sign out, then sign back in to A.
   - **Expect:** the session changes correctly and A's own data appears.
3. Use an invalid password, then request a password reset for A.
   - **Expect:** invalid credentials do not sign the user in; the reset flow confirms its result without exposing whether unrelated accounts exist.
4. Sign out of A and sign in to B.
   - **Expect:** A's meals, weight, and workout history do not appear in B's screens. Check after waiting for loads to finish and after navigating away/back.
5. Sign out of B and return to A.
   - **Expect:** A sees A's own data again, without B's data.

**Stop and report immediately** if user A's data appears while B is signed in, or vice versa.

## C. Nutrition: search, log, edit, delete, and persist

1. Open Nutrition and navigate between dates.
   - **Expect:** the displayed date changes to the selected date and the meal list matches that date.
2. Search for a common food, open a result, and add a reasonable serving to a meal.
   - **Expect:** the chosen item and serving are reflected in that meal; calories and macros update consistently.
3. Edit the serving or logged item.
   - **Expect:** the updated serving and nutrition totals are shown once, without a duplicate entry.
4. Delete the test meal.
   - **Expect:** it disappears and the totals recalculate.
5. Add one test meal again, force-close the app, reopen it, and revisit that date.
   - **Expect:** the meal remains and its values are consistent.
6. Search for a term with no results.
   - **Expect:** an understandable empty state appears; the app does not hang or show stale results as if they matched.
7. If comfortable doing so, use barcode scanning with a packaged food.
   - **Expect:** camera access is requested in context; denying it leaves the rest of Nutrition usable. A scan/product lookup failure must be visible and recoverable.

Record any unit or macro mismatch with the food, serving, and displayed totals; do not record personal dietary information.

## D. Weight and progress

1. Open the weight-tracking flow and enter a clearly fictional test measurement.
   - **Expect:** the value is validated, saved once, and shown in the correct week/history.
2. Edit the measurement and navigate to the prior and next week, including a week boundary if practical.
   - **Expect:** the edited value appears in the intended week; navigating weeks does not move or overwrite unrelated records.
3. Force-close and reopen the app.
   - **Expect:** the saved test value remains consistent.
4. If the device can safely be put offline, attempt a save with a new fictional value.
   - **Expect:** the UI must not claim a failed save succeeded. Restore connectivity, retry, and check for exactly one saved entry.

Do not use a real body measurement for this test.

## E. Workout persistence

1. Create a disposable test workout or plan; add an exercise and log a set with fictional values.
   - **Expect:** inputs validate and the saved workout appears in the expected place.
2. Navigate away and return, then force-close/reopen and check again.
   - **Expect:** the workout and set remain; no duplicate completion or duplicate set appears.
3. If the workout supports pause/resume/finish, exercise each available action.
   - **Expect:** the correct state is restored after returning to the screen.
4. Delete the disposable workout if the app provides that action.
   - **Expect:** only the selected test record is removed.

## F. Health Connect and steps

Use no real health data if avoidable. Do not grant broad access beyond the steps permission the app requests.

1. Open the steps/activity feature before granting access.
   - **Expect:** the app explains the feature and requests Health Connect access only when needed; it does not silently show fabricated or private step data.
2. Deny the permission.
   - **Expect:** the app remains usable, shows an unavailable/permission-denied state, and does not repeatedly prompt without an action from you.
3. Grant only the requested steps read permission, if available.
   - **Expect:** steps can load and the displayed date/day total is plausible. Zero steps is a valid result, not an error.
4. Revoke the permission in Android Health Connect / Settings, return to the app, and refresh or reopen.
   - **Expect:** access loss is handled gracefully; manual logging and unrelated app features remain usable.
5. If Health Connect is unavailable on the device, record **BLOCKED** for provider integration and verify the app presents a usable fallback rather than crashing.

## G. Network failure and recovery

Use only the dedicated test account.

1. With Nutrition already loaded, enable Airplane mode and try a read and a write.
   - **Expect:** failures are visible/actionable; the app does not show false success.
2. Disable Airplane mode and retry.
   - **Expect:** retry recovers; saved data is not duplicated or lost.
3. Background the app during a load, wait briefly, then return.
   - **Expect:** the screen recovers without a spinner that never ends or stale content from another account/date.

## H. Account deletion (destructive test; test account A only)

Do not perform this section on a personal or production account.

1. Verify A is the dedicated disposable test account and that you are signed in to A.
2. Use the in-app **Delete Account** flow and complete any re-authentication/confirmation.
   - **Expect:** success is shown only after the operation succeeds; a rejected re-authentication or network failure must not look like success.
3. Attempt to sign in again with A.
   - **Expect:** the deleted account cannot continue as an active account.
4. If the product has a public web deletion-request path, submit a separate test request there and record its confirmation. If no public path exists, mark this **BLOCKED** and flag it as a Play policy/release blocker until an owner verifies the required deletion path.
5. Confirm test-account data cleanup through the approved backend/admin process. Never inspect or delete other users' data.

## I. Layout, navigation, and accessibility spot-check

1. Use Android Back from the main screens and modals.
   - **Expect:** navigation is predictable; unsaved destructive actions are not silently applied.
2. Open a form, focus its fields, switch keyboard types where relevant, and dismiss the keyboard.
   - **Expect:** fields and primary actions remain reachable; text is not hidden behind the keyboard.
3. Increase Android font/display size one step and revisit Nutrition, Profile, and a form.
   - **Expect:** essential content and actions remain readable and usable.
4. If available, use TalkBack on sign-in, a primary navigation control, and a save/delete action.
   - **Expect:** controls expose understandable labels and roles and can be activated without sight.
5. Check light/system bars and edge-to-edge layouts on the device.
   - **Expect:** text, status/navigation bars, dialogs, and bottom actions are not clipped, overlapped, or unreadable.

## J. Final result and bug reports

For every **FAIL** or **BLOCKED**, record:

- Step ID and expected versus actual result.
- Device model, Android version/API, app version/version code, and build ID.
- Whether it is repeatable and the shortest steps to reproduce.
- A redacted screenshot or screen recording if useful.
- Whether user data may have been lost, duplicated, exposed, or falsely reported as saved.

Do not share credentials, `EXPO_TOKEN`, Firebase/Supabase secrets, unredacted user data, or private health details in screenshots or reports.

### Release decision

- **No-go:** any crash in a core P0 flow; cross-account data exposure; data loss/duplication; false success after a failed save/delete; unexpected sensitive permission or health-data access; or an unverified account-deletion requirement.
- **Investigate before go:** repeated stuck loading, broken recovery, unusable keyboard/layout, sign-in failure, or unexplained health permission behavior.
- **Preview pass is not release approval:** production still requires a reviewed signed AAB, inspection of its merged manifest/permissions/signing/version/configuration, Play internal-track installation, and completed Play policy/store declarations.

## Repeat on Play internal testing

When a reviewed production AAB is available, install it from the Google Play internal-testing track and repeat sections A, B, C, D, E, F, G, and H with dedicated test data. Specifically verify:

- Play installation and update delivery, not just APK sideloading.
- Google sign-in with the Play App Signing certificate registered in the relevant Google/Firebase OAuth configuration.
- Upgrade from the intended existing Play version and preservation of valid data.
- Play Console pre-launch report, crashes, ANRs, and any permission/policy warnings.
