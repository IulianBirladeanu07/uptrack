# Android full-workflow smoke and regression guide

Use this guide to exercise UpTrack on a physical Android phone with ADB access. It covers the main user journeys and high-risk state transitions; it is a repeatable product smoke/regression pass, not proof of every device, backend, or Play Store combination.

Run the Core Smoke Path after every development build. Run the Full Workflow Pass before a release candidate, after a feature change, or when investigating a report. Record unavailable and untested checks instead of assuming they passed.

## 1. Safety and test data

- Use a dedicated test account with fictional profile, weight, nutrition, and workout data. Use a separate disposable account for account deletion.
- Never send passwords, one-time codes, access tokens, personal health information, or unredacted account screens in a report.
- Do not test destructive actions against an account or records that must be retained. Confirm the active account before deleting a food, workout, split, template, profile picture, or account.
- Do not run `adb shell pm clear`; it erases local app data and can destroy unsynced offline meal writes. Do not uninstall/reinstall over an account with pending offline writes.
- Use Android Settings to restore network, permissions, display scale, and notification settings after testing.
- Use a known packaged food with a barcode. Do not create entries in a shared product catalog unless the test environment is approved for writes.

## 2. Build and run record

| Field | Value |
|---|---|
| Tester / date and local time | |
| Device model / Android version / API | |
| Install source | EAS development / EAS preview / Play internal |
| Git commit | |
| EAS build ID | |
| App version / version code | |
| Test account alias (never email/password) | |
| Network / permissions changed during test | |
| Overall result | PASS / FAIL / BLOCKED / NOT RUN |

For a release candidate, record whether it is a sideloaded APK or a Play internal-track install. Sideload testing does not verify Play App Signing, Play installation/update behavior, or Play Console declarations.

## 3. ADB setup and evidence capture

Connect the phone by USB, enable USB debugging, choose file transfer if prompted, and accept the authorization dialog. Confirm the device is authorized:

```bash
adb devices -l
```

The device state must be `device`, not `unauthorized`. The Android application ID is `com.iulianbirladeanu.uptrack`.

Launch UpTrack:

```bash
adb shell monkey -p com.iulianbirladeanu.uptrack -c android.intent.category.LAUNCHER 1
```

Capture a screenshot when a result needs evidence:

```bash
adb shell screencap -p /sdcard/uptrack-evidence.png
adb pull /sdcard/uptrack-evidence.png .\uptrack-evidence.png
```

Capture relevant native and React Native errors after reproducing a failure:

```bash
adb logcat -d -v time -s ReactNativeJS:V ReactNative:V AndroidRuntime:E Expo:W
```

Save logs privately first. Review and redact account identifiers, emails, tokens, food notes, and health data before sharing. A screenshot alone is not a reproduction.

### ADB interaction notes

- Use screenshots, taps, swipes, Back, keyboard input, and UI hierarchy inspection as needed. The account owner should enter credentials manually.
- Keep the phone awake and unlocked. React Native controls may not have useful labels in Android's UI hierarchy, so use screenshots for layout and focus checks.
- If Metro is used, confirm it is serving this checkout and the connected development build. A dev-client launcher error, missing native module, or bundle-resolution error is a blocked setup, not an app-flow pass.

## 4. Result definitions and stop conditions

- **PASS:** observed behavior matches the expected result.
- **FAIL:** behavior differs, crashes, loses/duplicates data, or cannot recover.
- **BLOCKED:** the build, account, permission, service, hardware, or test data is unavailable.
- **NOT RUN:** the case was intentionally not attempted.

Stop and report immediately for a core-flow crash, cross-account data exposure, unexpected deletion, data loss/duplication, false success after a failed save, or access to camera/health data that was not granted.

## 5. Core Smoke Path (P0, about 15 minutes)

### P0-01 — Cold launch and session

1. Launch UpTrack from a fully closed state.
2. Observe the loading screen, then the signed-in or signed-out destination.
3. Background the app for 10 seconds, return, and navigate between two bottom-nav destinations.

**Expect:** no crash, blank screen, or indefinitely spinning splash; no navigation loop; data stays attached to the active account.

### P0-02 — Main navigation

1. Visit Home, Workout, Nutrition, and Progress using bottom navigation.
2. Use Android Back from a secondary screen and a modal.

**Expect:** each destination renders; selected tab and screen agree; Back closes the modal or returns to the expected parent.

### P0-03 — Food search and add

1. Open Nutrition, choose today's date and a meal, and tap Add Food.
2. Search a common item, open its serving/detail flow, and add one serving.
3. Return to Nutrition and switch away from and back to that meal.

**Expect:** Food Selection carries the meal/date context; the item, serving, kcal, and macros agree across screens; the item appears once; daily and meal totals update once.

### P0-04 — Edit, delete, and persistence

1. Open the logged item, change its quantity, save, and return.
2. Confirm it updates instead of duplicating. Delete the disposable item.
3. Add it again, force-stop/relaunch, and revisit that date.

**Expect:** serving and nutrients scale consistently; delete affects only the selected row; data survives relaunch without duplication or stale totals.

### P0-05 — Search tabs and empty state

1. Visit Frequent, Recent, and Favorites in Food Selection.
2. Search for an unlikely term, then clear the query.

**Expect:** tabs show their own results; empty/loading/error states are understandable; clearing does not leave mismatched stale results; empty Favorites is not blank or frozen.

### P0-06 — Workout start and finish

1. Open Workout, start a disposable workout, choose an exercise, log one fictional set, and finish/save.
2. Open workout history and inspect the new record.

**Expect:** one set and one workout record; history details match the completed session.

### P0-07 — Profile and Progress

1. Open Profile and inspect profile/plan values.
2. Open Progress and visit its available tabs/sections and date ranges.

**Expect:** no stale account data, broken charts, clipped totals, or unending loader.

## 6. Full Workflow Pass

### A. Install, launch, update, and native shell

1. Install the development client or preview build from the recorded EAS artifact. For an upgrade check, install over the previous version without clearing data.
2. Launch from the icon, close/reopen, and repeat after device restart if practical.
3. Inspect Android App info permissions and record unexpected permissions.
4. Check status/navigation bars, keyboard, dialogs, splash, safe areas, and system Back on representative screens.

**Expect:** install/upgrade succeeds; valid test data remains; no persistent blank screen/splash; system bars and bottom actions are readable. Native dependency/config changes require a newly built development client.

### B. Authentication and onboarding

Use disposable accounts and have the account owner enter credentials manually.

1. Login: submit empty fields, malformed email, wrong password; show/hide password; dismiss/reopen keyboard.
2. Registration: submit empty fields, mismatched passwords, and invalid input. Create an account only when its dedicated test inbox is accessible.
3. Email verification: test unverified sign-in, resend if available, verify through the test inbox, then sign in.
4. Forgot Password: test validation and request a reset for the test account. Feedback should not reveal whether unrelated accounts exist.
5. Google sign-in: use only a dedicated Google test account and a build whose OAuth configuration matches its signing certificate. Cancel once and retry if practical.
6. Onboarding: complete each step; test required-field errors, back/forward navigation, unit selectors, goal/activity/experience choices, numeric validation, plan summary and confirmation.
7. Sign out and sign in again; confirm completed onboarding is not repeated.

**Expect:** unverified password accounts cannot reach the main app; invalid attempts do not authenticate; onboarding values survive step navigation and save once; summary targets match saved profile; provider cancellation returns safely.

### B1. First-time user: registration to first use (P0)

Run this once per release candidate with a fresh, dedicated test account and an inbox the tester controls. First confirm that the build is pointed at the intended Firebase/Supabase environment; do not create test accounts or food records in an unintended production environment.

1. Start signed out and choose Create Account. Enter a new test email/password and submit; also verify required-field and password-mismatch errors before creating the account.
2. Complete any email-verification step from the test inbox. Return to the app and sign in. If verification is still pending, confirm the app clearly explains what to do and offers the supported resend/retry path.
3. Complete the full onboarding profile: enter fictional age, height and weight; choose units, goal, experience/activity values and any other required preferences. Navigate backward and forward once to verify values remain filled.
4. Review the generated plan/targets, confirm it, and wait for the app to reach the main screen.
5. Open Profile and verify the saved profile and plan values match onboarding. Edit one harmless test preference, save, leave the screen, and reopen to verify persistence.
6. Open Nutrition, add one food to a meal, and verify the daily summary and meal list use the new account's initial targets.
7. Force-stop and relaunch. Confirm the account remains signed in, onboarding does not repeat, the profile/targets remain, and the food appears once.
8. Sign out and sign back in. Confirm the same profile and food return, then run the account-isolation check with a second test account when available.

**Expect:** registration creates one account; verification gates access as designed; onboarding data and target plan save together; profile values persist across navigation/relaunch; first food logging works without missing-profile errors; no duplicate account/profile/food is created by retries.

### C. Home/Dashboard

1. Check date, daily calories, macros, weight, steps, and scheduled workout.
2. Visit today, yesterday, and another date; return to today.
3. Open weight and steps destinations from dashboard cards.
4. Dismiss a dismissible notice and verify its intended dismissal lifetime.
5. Open the scheduled-workout card and follow it into the workout flow.

**Expect:** local dates do not shift; summaries reconcile with Nutrition/Progress; zero steps differ from unavailable/error; scheduled sessions match the active split and date; cards open the correct destinations.

### D. Nutrition day, meal, and food-item flows

1. Visit different dates and all four meals, including empty and populated states. Add multiple foods to one meal and to multiple meals.
2. Confirm meal context/date carries into Food Selection. Check item ordering, counts, meal total, kcal, and macro chips.
3. Open a food item; adjust amount and supported units; save, reopen, edit, delete, and cancel/undo when offered.
4. Create a custom food. Test required fields and numeric input; save/use it and verify the row and totals.
5. If Combine Foods is offered, select multiple foods, set portions, review totals, save, and verify expected result identity.
6. Check tiny/zero-rounded macros, long names, missing images, decimals, and large values where suitable test products exist.
7. Exercise calorie and macro states below and above target; exactly-at-target if attainable. Exceeding a target must not be represented as failure unless product copy explicitly intends it.
8. Force-stop/relaunch and revisit both current and past dates.

**Expect:** date and meal remain correct; every non-empty meal total is present and reconciles; changes affect totals once; macros use consistent rounding; fallback images render; long names truncate cleanly; dates do not mix.

### E. Food Selection, search, barcode, and product detail

1. Enter Food Selection from each meal where possible; verify the heading/date/context.
2. Exercise Frequent, Recent, Favorites, empty state, recent-search clear/remove, and favorite/unfavorite if available.
3. Search exact/partial names, diacritics, mixed case, punctuation (commas/parentheses), whitespace, rapid edits, clear, and no-results terms.
4. Exercise available filters/sorts such as low-calorie, high-protein, and best match, individually and in combinations.
5. Open results and verify identity, serving amount, nutrition values, image/fallback, and back navigation.
6. Tap Add once and wait for feedback. Return to Nutrition and verify meal, quantity, and total. Check repeated taps do not cause unintended duplicates.
7. Barcode: allow, deny, and permanently deny camera access if offered; test Settings/retry, a known product, unknown barcode, failed lookup, cancel/back, and network loss.
8. Open Create Food from its normal route and an empty-results action; verify form, save, and return behavior.

**Expect:** results match the current query; daily progress is clear under/over target; macro chip rounding is consistent; add feedback is immediate and unambiguous; denied permission leaves search usable; unavailable services have recovery.

### F. Weight Tracker and weight history

1. Open Weight Tracker through available Dashboard/Profile/Progress routes.
2. Add a fictional decimal measurement; test blank, zero, negative, nonnumeric, and implausible values as supported.
3. Edit/delete disposable entries; inspect confirmation and totals.
4. Change time ranges/weeks, including a Monday boundary; visit date controls if available.
5. Change metric/imperial display if supported and verify equivalent values.
6. Check goal progress while moving both toward and away from the goal.
7. Relaunch and verify persistence.

**Expect:** validated values save once to the intended date/week; conversions remain coherent; progress does not increase when moving away from goal; chart/history matches records.

### G. Steps and Health Connect

1. Open steps/activity before granting access; confirm no premature permission prompt.
2. Trigger Connect, deny, and verify the app remains usable.
3. Grant only requested step-read permission; test zero and populated days if controlled data is available.
4. Revoke permission in Android/Health Connect, return, refresh, and reopen.
5. Test below/at/above goal if data is safely controllable.

**Expect:** zero is distinct from unavailable/error; goal remains visible after reaching it; denied/revoked access causes no crash or repeated prompt loop. Mark BLOCKED if the device/provider lacks deterministic data.

### H. Workout session lifecycle

1. Inspect today's schedule, rest day, active split, and empty state.
2. Start a workout from the main action and from a scheduled workout/template if available.
3. Select/search/filter exercises; create a custom exercise and verify it appears once on return.
4. Log multiple sets; edit/reorder/remove a set; test reps, weight, duration, rest presets/custom rest, notes, and validation.
5. Navigate away/back, background, lock/unlock, and force-stop/relaunch mid-session. Verify restoration and account ownership.
6. Pause/resume/abandon if offered; finish with a note and inspect completion details.
7. Check rest timer/notification only if supported; verify current exercise and notification stop after finish.
8. Exercise no-valid-set and normal completion cases.

**Expect:** active workout does not reset or leak across accounts; set calculations update once; finish creates one history record; details match; timers/listeners stop when leaving/finishing.

### I. Workout and exercise history

1. Open Workout History; inspect loading, empty, populated, refresh, pagination, and retry.
2. Open a workout detail and verify exercises, sets, local date/time, duration, notes, and summary.
3. Open Exercise History for an exercise with and without records; inspect charts/session list.
4. Change history ranges; background/return; retry after temporary network loss.

**Expect:** pagination has no duplicates/skips; empty differs from error; cached rows remain understandable during refresh; dates/counts match records.

### J. Workout templates and splits

1. Open Workout Library; inspect empty/populated states, active indication, refresh/focus reload, and previews.
2. Create a disposable template through every step; select exercises; review and save.
3. Edit details/exercises; attempt duplicate/blank names; verify stable identity and validation.
4. Create a weekly split; assign workout/rest days and templates; preview, activate, then compare Dashboard/Workout/Progress.
5. Create a rotation split if supported; verify day 1, next-day mapping, rest day, wraparound, and unchanged weekly behavior.
6. Edit a split/schedule day and verify after navigation away/back.
7. Delete only a disposable inactive split/template. Test active-split deletion only with disposable data and check fallback/no-active state.

**Expect:** names are unique per account; create/edit/preview retains data; active split is consistent across screens; weekly and rotation schedules are not confused; delete leaves no stale references.

### K. Progress

1. Visit every Progress tab/segment and chart/range.
2. Inspect empty, one-record, and multi-record states.
3. Change range, split, and nutrition phase/maintenance control if available; return to prior values.
4. Compare weight/nutrition/workout counts with source screens.
5. Rotate if supported; check narrow width and larger font/display size.

**Expect:** charts and labels remain readable; empty states do not imply a false trend; totals reconcile; changing split/range does not leave stale data.

### L. Profile, account settings, and deletion

1. Edit safe fictional profile values, save, leave/reopen, and verify.
2. Exercise profile picture selection, permission denial/retry, upload feedback, replacement/removal if available.
3. Change password only on a password-provider test account; test wrong current password, validation, success, and next sign-in. Do not apply this to a Google-only account.
4. Change email only on a test account with inbox access; verify confirmation, auth/profile synchronization, and recoverable errors.
5. Open privacy, deletion/support links, and legal destinations; verify they load or show an understandable unavailable state.
6. Delete only a separately disposable account. Confirm identity, reauthentication, success/failure behavior, and public deletion path.
7. Sign in to account B without clearing storage; inspect Dashboard, meals, weight, history, splits, templates, searches/favorites, and active workout. Return to A and verify A's data.

**Expect:** changes save once; provider-appropriate controls; no false success on failure; sign-out clears user-scoped data; active workout cannot be saved under another UID; account deletion is not tested on a valuable account.

### M. Offline, retries, and background transitions

Use a disposable test account; preserve USB debugging. Toggle Airplane mode or Wi-Fi/mobile data in Android Quick Settings and restore the original state after each case.

1. Load a meal day, go offline, add/edit/delete a meal, and inspect queued/sync feedback.
2. Force-stop/reopen offline; inspect whether local meal state/pending write remains.
3. Reconnect, wait for sync, navigate away/back, relaunch, and verify exactly one saved item.
4. Retry a failed write; check for lost, duplicated, reordered, or reverted food.
5. Attempt search, barcode lookup, profile/weight save, and history reads offline; note which are expected cached/queued versus network-only.
6. Background during fetch/save, lock/unlock, resume, and pull-to-refresh/retry.

**Expect:** no false remote-success claim; queued meal edits remain visible and reconcile once; errors recover; user/date scope persists. Record intended offline capability for each action.

### N. Accessibility, input, and visual resilience

1. Test Android Back in primary screens, modals, forms, date picker, and scanner.
2. Focus text/number/email/password fields; switch keyboards; dismiss and submit from keyboard where supported.
3. Increase font/display size one step; test Nutrition, Food Selection, Workout, Profile, and Progress.
4. Use TalkBack for Login, main navigation, a food add action, a workout set control, and save/delete confirmation.
5. Test long names/notes, missing images, no results, empty history, loading/error, and background refresh.
6. Check dark theme, status/navigation bar contrast, safe areas, scroll reachability, touch targets, overlap, and responsiveness.

**Expect:** primary actions and labels remain visible/operable; focus announcements are meaningful; keyboard/system overlays do not cover essential controls; no clipping/overlap under supported settings.

## 7. Cross-account isolation (mandatory after auth/cache changes)

1. Account A creates a food log, weight entry, workout, and custom exercise/template/split where permitted.
2. Sign out and sign in to B without clearing app storage.
3. Inspect each corresponding screen and ensure no A workout is resumed in B.
4. Sign out of B and sign back into A.

**Expect:** B sees none of A's private records or unfinished workout; A's data remains when A returns. Stop immediately and capture redacted evidence if data crosses accounts.

## 8. Coverage matrix

Mark a route PASS only after opening and meaningfully exercising it.

| Area / route | Minimum interaction | Result / issue ID |
|---|---|---|
| Splash / bootstrap | Cold start, resume, config/error state | |
| Login | Invalid input, test login, password visibility | |
| Registration | Validation, dedicated registration/verification | |
| Forgot Password | Validation and reset feedback | |
| Onboarding Flow | Complete steps, validation, units | |
| Plan Summary | Review, confirm, persisted targets | |
| Dashboard | Date, summaries, cards, bottom navigation | |
| Workout | Schedule, active split, start entry points | |
| Start Workout | Exercise, sets, timer/state, finish/abandon | |
| Exercise Selection | Search/filter/select/create-exercise return | |
| Create Exercise | Validation and custom save | |
| Workout Library | Load/refresh, active state, preview/edit/delete | |
| Create Template | Create/edit and duplicate-name validation | |
| Create Split | Weekly/rotation schedule, preview, activate | |
| Preview Split | Schedule, edit return, activation | |
| Workout History | Empty/loading/error, pagination, detail | |
| Workout Details | Values match completed record | |
| Exercise History | Populated/empty history and chart | |
| Nutrition | Dates, meals, totals, edit/delete, persistence | |
| Food Selection | Search tabs/filters, add feedback, meal context | |
| Food Detail | Serving/units, save/edit/back | |
| Custom Food | Validation, save, selection | |
| Barcode Scanner | Permission, known/unknown scan, cancel/error | |
| Weight Tracker | Add/edit/delete, conversion, goal direction | |
| Weight History | Ranges, chart, empty/populated | |
| Progress | Tabs, ranges, charts, value reconciliation | |
| Profile | Edit/save, picture, account settings | |
| Change Password | Provider-appropriate validation/recovery | |
| Account deletion | Disposable account only | |

## 9. Bug report template

```text
ID:
Build ID / commit / app version:
Device / Android version and API:
Account alias (no email or credentials):
Screen / route:
Scenario ID:
Result: FAIL / BLOCKED
Preconditions:
Steps to reproduce:
Expected:
Actual:
Repeatability:
Data impact: none / lost / duplicated / exposed / unknown
Network and permission state:
Screenshot/video/log references (redacted):
```

Keep one issue per reproducible behavior. Include timestamps and a short recording for transient failures; attach only relevant redacted log lines for crashes/network failures.

## 10. Release decision

**No-go:** core-flow crash, cross-account exposure, data loss/duplication, false save/delete success, unexpected sensitive permission, broken account deletion, or unrecoverable sign-in/data access.

**Investigate before go:** repeated stuck loading, unclear offline recovery, broken keyboard/Back behavior, inaccessible primary actions, bad chart/date reconciliation, or unverified camera/Health Connect behavior included in release claims.

Passing this guide is not Play release approval. A production candidate still needs signed AAB review, Play internal-track install/upgrade checks, Play App Signing OAuth verification, Play policy declarations, and review of Play pre-launch reports, crashes, ANRs, and permission warnings.
