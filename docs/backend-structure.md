# Backend structure: Firebase and Supabase

Reference for agents and for the owner. It describes what the code does and what is deployed, checked on 2026-10-16. Where a statement could only be confirmed from the code and the rules files, and not from a console or a device, it says so. `AGENTS.md` has the short version. The last two sections are notes on derived nutrition and progress data.

## Who holds what

| Data | Where | Why |
|---|---|---|
| Accounts, profile, plan targets, weight, steps, meals, workouts, templates, splits, measurements, custom exercises | Firebase (Auth, Firestore) | Per-user data, protected by Firestore rules |
| Profile pictures | Firebase Storage | One file per user |
| Shared exercise catalog | Firestore `exercises` | Read-only for clients |
| Food database (search and barcode lookup) | Supabase Postgres | Shared, not per user |

Supabase never holds user data. It sees every client as the `anon` role, because the app signs in with Firebase and does not pass a Firebase identity to Supabase. Anything that must be private to one user belongs in Firestore.

## Firebase

Project id `activerecovery-3a400`. The web config reaches the app through `app.config.js` `extra` (public values only). The client is initialised in `src/features/auth/services/firebaseConfigService.ts` with `getFirestore` defaults, so Firestore rejects `undefined` field values. Build write payloads without them.

### Auth

Email and password, plus Google sign-in. `auth/utils/emailVerification.ts` identifies a password-provider account whose email is not verified.

### Firestore collections

Every user-data query filters on `uid` or uses a uid-based document id. The rules depend on that.

| Collection | Document id | Main fields | Written by |
|---|---|---|---|
| `users` | uid | Profile and plan (`targetCalories`, `weightChangePlan`, `activeSplitId`, `rotationStartDate`, `profileSetupComplete`, ...), `weightIns[]` (one entry per week with a `days` map), `dailySteps` (map of date to steps), `weeklyNutrition[]` (weekly snapshots), `phaseHistory[]`, `workoutTemplateNames` (per-user template name registry) | Many modules, with `setDoc(..., { merge: true })`. The full field list is `UserData` in `src/shared/types.ts` |
| `meals` | `{uid}_{YYYY-MM-DD}` (local date) | `uid`, `date`, `breakfast[]`, `lunch[]`, `dinner[]`, `snacks[]`, `timestamp`. Each food in an array is a `LoggedFood`: `id`, `productName`, nutrients, `quantity`, `unit`, `usageCount` | `nutrition/services/mealService.ts`, through the converter in `src/shared/firestore/converters.ts` |
| `workoutHistory` | auto | `uid`, `timestamp` (server time), `workoutName`, `duration`, `note`, `exercises[]` with `sets[]` (`weight`, `reps`, `isValidated`, `isPR`, `estimated1RM`) | Created once when a workout finishes. Never updated |
| `workoutTemplates` | `{encodeURIComponent(lowercased name)}_{uid}`, or `{autoId}_{uid}` when the first id belongs to a renamed template | `uid`, `templateName`, `exercises[]` | `workout/handlers/WorkoutHandler.ts` |
| `workoutSplits` | auto | `uid`, `createdAt`, `schedule` keyed by weekday name (or `"1"` to `"n"` for rotation splits), each day with `templateId`, `templateName`, `exercises`, `duration` | `WorkoutHandler.ts` |
| `measurements` | auto | `uid`, `timestamp`, body measurements | Created only. Never updated |
| `customExercises` | auto | `uid`, exercise fields | `WorkoutHandler.ts`, merged into the catalog by `fetchExercises` |
| `exercises` | muscle group name | Shared catalog | Clients only read it |

Template names are reserved per user in `users/{uid}.workoutTemplateNames`, updated in one transaction together with the template write. A template deleted outside `deleteTemplateFromFirestore` leaves a stale reservation.

### Firestore rules

Source: `firebase/firestore.rules`, deployed by the owner and pointed to by `firebase.json`. Summary of what the code must respect:

- `users/{uid}`: the owner can get, create, update and delete. No field allow-list.
- `meals`: `get` needs a signed-in user and an id of the form `{own uid}_{date}`; `list` needs `resource.data.uid == auth.uid`; create requires `uid` to match and the id to equal `{uid}_{date field}`; update cannot change `uid` or `date`.
- `workoutHistory`, `measurements`: read, create and delete only. **There is no update rule.** An `updateDoc` or a `setDoc` on an existing document is denied.
- `workoutTemplates`, `workoutSplits`, `customExercises`: owner read, create and delete; update must keep `uid`. Template ids must end in `_{uid}` on create.
- `exercises`: read for any signed-in user, no writes.

Rules gotcha: where the read rule uses `resource.data` (`workoutHistory`, `measurements`, `workoutTemplates`, `workoutSplits`, `customExercises`), reading a document that does not exist is denied, because `resource` is null. Never `getDoc` or `transaction.get` an id that may be missing there. `users`, `meals` and `exercises` allow it. Jest mocks cannot show rule denials. `tests/rules/security-rules.test.cjs` runs the rules in the Firebase emulators, including the missing-document case; run `npm run test:rules` when changing rules or Firestore access.

### Firestore indexes

`firebase.json` covers rules and emulators only, and there is no `firestore.indexes.json`; indexes live in the console. The composite indexes that current code needs, checked against an export taken on 2026-10-16:

| Collection | Fields | Used by |
|---|---|---|
| `workoutHistory` | `uid` asc, `timestamp` desc | Paged history, recent-workout lookups, this-week count, and exercise history |
| `measurements` | `uid` asc, `timestamp` desc | latest measurements |
| `workoutSplits` | `uid` asc, `createdAt` desc | `fetchSplitsFromFirestore` |
| `meals` | `uid` asc, `date` desc | `fetchLast30DaysMeals` (range on `date`) |

Queries that only filter on `uid` (templates, custom exercises) use the automatic single-field index. The export also lists indexes for collections the code no longer uses (`breakfasts`, `lunches`, `dinners`, `recentFoods`, `frequentFoods`, `likedFoods`, `createdFoods`, `usuallyUsedFoods`, `products`, `nonBarcodedProducts`, `Workouts`, and older `meals` shapes). They are harmless.

A new query with a filter and an `orderBy` on different fields needs a new composite index before it works. Add it in the console and record it in this table.

`fetchSplitsFromFirestore` orders by `createdAt`, so a legacy split document without that field is silently left out. Only the owner can check the console for such documents.

### Client read caches

The app uses one in-memory TanStack Query client for reads that benefit from request deduplication and shared freshness. Its defaults are one-minute staleness, ten-minute garbage collection, one retry, and no automatic focus/reconnect refetch. Exercise catalogs are cached for 12 hours; workout history, templates, and splits for five minutes; food-catalog searches for five minutes; and barcode lookups for one hour. Large unfiltered food-catalog reads are not cached.

Private query keys include the Firebase uid, and private cached queries are removed when the authenticated identity changes. Food-catalog queries are shared public data and are retained. Workout history is fetched in 100-record pages: History loads older pages on scroll, Progress loads pages as needed for its 104-week view, and recent-workout lookups reuse the first cached page. Workout saves invalidate history; template/split writes invalidate their related reads.

Meals and weight keep their existing specialized caches because they also provide persistence and write-through/optimistic behavior. Profile documents and transaction validation reads remain uncached to avoid serving stale user data across the many existing mutation paths.

### Storage

Source: `firebase/storage.rules`. `profilePictures/{uid}.jpg`: the owner can read and delete; create and update need an image under 5 MB. `exercise_images` and `nutrition_images`: public read, no writes.

## Supabase

Client: `src/shared/services/supabaseClient.ts`, using the public URL and the publishable key from `extra` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Generated table types: `src/shared/database.types.ts`; app aliases are `BarcodedProduct` and `NonBarcodedProduct` in `src/shared/types.ts`. Never put a service-role key in the app or in `.env` files that could be bundled.

### Tables (public schema)

`barcoded_products`: primary key `barcode_id` (text, not null). Columns: `product_name`, `calories`, `carbohydrates`, `category`, `fats`, `fiber`, `protein`, `salt`, `saturated_fats`, `sugar`, `image`, `last_updated` (timestamptz), `serving_size_unit`, `serving_size_value`. Nutrient columns are `numeric`. All columns except `barcode_id` are nullable. Because `barcode_id` is the primary key, two rows cannot share a barcode, and a duplicate insert fails with a unique violation.

`non_barcoded_products`: primary key `id` (uuid, default `uuid_v7()`). Columns: `product_name_en`, `product_name_ro`, the same nutrient, category, image and serving columns as above.

Indexes: both primary keys; `barcode_id_index` on `barcoded_products` (it duplicates the primary key if it is a plain btree on `barcode_id`; dropping it is optional and unverified); on `non_barcoded_products`, text-search indexes `products_name_en_textsearch` and `products_name_ro_textsearch`, and trigram indexes `idx_product_name_en_trigram` and `idx_product_name_ro_trigram`.

### Row-level security

Source: `supabase/rls.sql`, applied by the owner. Both tables have RLS on. Read is open to `anon` and `authenticated`. `barcoded_products` also allows insert for both roles when the barcode is 8 to 14 digits, the name is 1 to 200 characters and the four main macros are not negative (a null passes). Update, delete and truncate are revoked on both tables. Consequence: anyone holding the public key can add a row for a barcode that does not exist yet; no checks cover `image` or upper bounds. See the recommendations in `APP_FLOW_AUDIT_HANDOFF.md`. CI does not test the policies against a live Supabase project; `scripts/verify-rls.js` does, run by hand.

### How the app uses it

- Text search: `nutrition/handlers/NutritionHandler.ts` queries `non_barcoded_products`, quoting search terms before they enter PostgREST `or()` filters (keep it that way), and calls the `search_products_similarity` RPC (`search_term`, `similarity_threshold`, `limit_count`).
- Barcode lookup: `nutrition/helpers/useBarcodeScanner.ts` reads `barcoded_products` by `barcode_id`.
- Custom food with a barcode: `nutrition/helpers/useCustomFood.ts` checks that the barcode is not present, then inserts. If two inserts race, the second fails on the primary key (error code `23505`) and the user sees the same "Product Exists" message as when the check finds the barcode. The save button ignores a second tap while a save is running.
- `scripts/verify-rls.js` checks the policies with the public key (`SUPABASE_URL` and `SUPABASE_ANON_KEY` in the environment). With `--insert` it leaves a probe row (barcode `99999999999999`, name `__rls_probe__`) to delete in the SQL editor.

## Adding or changing data

1. New Firestore collection: give it a `uid` field, add rules (read, create, update, delete) and an index if a query orders on another field, and add a row to the tables above.
2. New per-user AsyncStorage key: put the uid in the key, or add it to the sign-out clean-up in `AuthContext.tsx`.
3. New write: compare it with the rules first. Check for `undefined` values, for updates on collections without an update rule, and for reads of documents that may not exist.
4. New Supabase column or policy: write the SQL, check it with the owner, and let the owner run it. Update the table section here and `database.types.ts`.

## Not verified

Firestore rules are covered by the emulator tests above; this document's account of them was checked by reading the rules file. Supabase tables were checked from the owner's SQL editor output on 2026-10-16 (columns, primary keys, index names). Index definitions were truncated in that output. Console-only settings (Auth email-enumeration protection, API key restrictions in Google Cloud) are the owner's to check.

## Nutrition: frequent foods

The food category builder groups meals by a stable food identity rather than by meal slot. That keeps repeated items such as the same oat product across breakfast and lunch in one frequent-food bucket, while preserving the stored usage count for repeated additions consolidated into one meal entry. Its displayed meal category tracks the food's latest logged meal. When two foods have the same total count, the more recently used one wins the tie-breaker.

## Progress: lift identity

Workout summaries normalize lift identity by exercise name and resolved muscle group. If a same-named exercise has only one known group across the recorded workouts, missing group data is filled from that single known value so the lift is treated as one continuous series. If the same name appears under multiple muscle groups, those lifts remain separate.
