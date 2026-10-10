# October 2026 audit

Output of a security, bug and TypeScript audit of `master` at `fad590d`, done on 2026-10-10. This directory is temporary. Delete it once `PLAN.md` is done. `AGENTS.md` at the repo root is the permanent guide and does not depend on it.

| File | Contents |
|---|---|
| `FINDINGS.md` | All 40 findings with evidence and status, false positives, TypeScript notes, verification, and what was not verified |
| `PLAN.md` | Owner tasks, decisions to collect, and the prioritized fix plan |
| `rules/firestore.rules` | Proposed Firestore rules. Not deployed and not emulator-tested. |
| `rules/storage.rules` | Proposed Storage rules for profile pictures. Not deployed. |
| `rules/supabase-rls.sql` | Proposed row-level security for the two product tables. Not run. |

## Commits

Security:
- `8ab4636` Quote user search terms in Supabase or() filters (SEC-08)
- `6006516` Clear cross-account caches when the user signs out (SEC-06)
- `4899c6c` Do not reveal registered emails on password reset (SEC-10)
- `5828fdc` Stop logging user IDs when no templates or splits exist (SEC-11)
- `3ad9e21` Set an image content type on profile picture uploads (prepares SEC-05)

Bugs:
- `4f58757` Read the local calendar week in snapshotPreviousWeek (BUG-02)
- `0cf51d0` Stabilize resumeScanning to stop the barcode scanner effect loop (BUG-01)
- `7a6c420` Do not re-remove a swiped food after a failed delete (BUG-05)
- `fd41c37` Pass the viewed day through the Create Food flow (BUG-04)
- `9cbfc69` Open the split editor with the split from PreviewSplit (BUG-06)
- `61a1837` Keep the workout library in sync after create, edit and delete (BUG-07, BUG-08)
- `139b21b` Reload exercises after creating a custom exercise (BUG-09)
- `6472218` Match the Favorites category label in FoodListItem (BUG-10)
- `eda0b95` Sum nutrient fields numerically when merging a re-added food (BUG-03)
- `8df9f15` Clear split-based state when no splits remain (BUG-19)
- `e1e92b7` Open the split preview from the Active button (BUG-22)
- `adcd7ce` Wire the Create Custom Food button in empty search results (BUG-17)
- `5e6ddfd` Key weight data loads by local date (BUG-25)
- `b1bb309` Remove the SearchBar recent search test seed (part of BUG-28)
- `5188cc9` Add the react-native-health config plugin (BUG-26)
- `14ce5c6` Run CI on master (BUG-27)
- `01925df` Wire the recent search Clear and remove buttons (BUG-29)

TypeScript:
- `616683c` Convert the nutrition data layer to TypeScript
- `7f97c39` Convert home notice and duration utils to TypeScript
- `df50231` Type the auth context and the daily nutrition and recent search hooks
- `90a2ecd` Enable noFallthroughCasesInSwitch, noImplicitOverride, noUnusedLocals and noUnusedParameters
- `df681e3` Use the shared DateInput type instead of local copies

`AGENTS.md` and `CLAUDE.md` are committed separately from this directory, so removing `audit/` leaves them in place.
