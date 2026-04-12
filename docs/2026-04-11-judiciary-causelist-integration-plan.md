# Cause List Integration — Detailed Plan

**Date:** 2026-04-11
**Status:** Draft — awaiting confirmation on open questions
**Source portal:** https://causelist.judiciary.gov.bd/

---

## Recon summary

**Cause list endpoint (HTML, server-rendered):**
```
GET /causelist?courtId=<ID>&date=DD-MM-YYYY
```
Table rows contain 5 `<td>`s: serial (Bangla digits), case type + number (e.g. `দেওয়ানী আপীল - ২৮/২০১৮`), activity, next date, brief order. Cleanly parseable with DomCrawler.

**Court discovery APIs (JSON):**
- `/api?path=geo/divisions` — 8 divisions
- `/api?path=geo/districts` or `?path=geo/districts&division_id=X` — districts
- `/api?path=courts&district_id=X&office_origin_id=Y` — courts under a district + origin

**Court origin IDs (hardcoded in portal HTML):**
- District Judge: `4,5,6,7,8,18,19,20,21,74,75,76,83,94,103,105`
- CJM: `14,15,16,17,84,85,91,95`
- Tribunals: `9,72,73,77,79,80,81,82,86,87,89,96,102,104,110,111,112`
- Metro Sessions: `10,11,12,88`
- CMM: `13,22,23,24,78,92,100`
- Special Tribunal: `109`

**No JSON API for the cause list itself** — the list is server-rendered HTML and must be scraped. Saturdays return empty tbody (courts closed). `08-04-2026` (Wednesday) returned 38 rows for Munshiganj District & Sessions Judge court (id=59).

**Legal posture:** public data, read-only, low request volume. Keep `User-Agent: CaseDex/1.0 (+contact@casedex.app)`, honour robots.txt, throttle requests.

---

## Architecture at a glance

```
Daily cron (04:30 BD time)
  └── judiciary:scrape-causelist
        └── for each tenant court with active cases:
              └── dispatch ScrapeJudiciaryCauseListJob(court_id, date, tenant_id)
                    ├── fetch /causelist?courtId=X&date=DD-MM-YYYY (throttled)
                    ├── ParseJudiciaryCauseListAction (HTML → rows[])
                    └── for each row:
                          └── MatchCauseListRowAction
                                ├── find cases by (court_id, type, serial, year)
                                └── if match: CreateCauseListNotificationAction
```

### Key design choices
- **Extend the existing `courts` table** — don't create a parallel "external_courts" table. Adds `judiciary_portal_court_id` + `last_causelist_synced_at`.
- **Phase 1 creates only notifications**, not auto-hearings. Users read the notification and decide if/how to log a hearing. Avoids data-quality guesswork (is "রায় প্রচার" a hearing?).
- **Scraper is per-court, per-date** — idempotent via unique notification constraint, so re-runs are safe.
- **Parser is pure and fixture-tested** — no network calls in unit tests.

---

## Phase 1 — Data model & dependencies

### 1.1 New composer dependency
```
composer require symfony/dom-crawler symfony/css-selector
```
Laravel's HTTP client is already available via `Illuminate\Support\Facades\Http` (Guzzle under the hood). DomCrawler + CssSelector gives us `$crawler->filter('tbody tr')->each(...)`.

### 1.2 Migration — extend `courts` table
**New file:** `backend/database/migrations/2026_04_11_000001_add_judiciary_fields_to_courts_table.php`
```php
Schema::table('courts', function (Blueprint $table) {
    $table->unsignedInteger('judiciary_portal_court_id')->nullable()->after('court_type_id');
    $table->timestamp('last_causelist_synced_at')->nullable()->after('is_active');
    $table->unique('judiciary_portal_court_id');
});
```

### 1.3 Migration — extend `cases` table
**New file:** `backend/database/migrations/2026_04_11_000002_add_registry_fields_to_cases_table.php`
```php
Schema::table('cases', function (Blueprint $table) {
    $table->string('registry_case_type_bn')->nullable()->after('case_number');
    $table->unsignedInteger('registry_case_serial')->nullable()->after('registry_case_type_bn');
    $table->unsignedSmallInteger('registry_case_year')->nullable()->after('registry_case_serial');
    $table->index(
        ['court_id', 'registry_case_type_bn', 'registry_case_serial', 'registry_case_year'],
        'cases_registry_lookup_idx'
    );
});
```

The existing freeform `case_number` stays untouched. These three new fields are the structured registry key that matches what the portal exposes.

### 1.4 New migration — `judiciary_causelist_logs` (audit)
**New file:** `backend/database/migrations/2026_04_11_000003_create_judiciary_causelist_logs_table.php`
```php
Schema::create('judiciary_causelist_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('court_id')->constrained('courts');
    $table->date('cause_list_date');
    $table->enum('status', ['ok', 'empty', 'failed']);
    $table->unsignedInteger('row_count')->default(0);
    $table->unsignedInteger('match_count')->default(0);
    $table->text('error')->nullable();
    $table->timestamp('scraped_at');
    $table->timestamps();
    $table->unique(['court_id', 'cause_list_date']);
});
```

Tracks every scrape attempt. Lets admins see "did we check court 59 yesterday?" and lets the scheduler skip already-done courts.

---

## Phase 2 — Bangla digits helper & case type dictionary

### 2.1 New file: `backend/app/Support/BanglaDigits.php`
Two static methods: `toEnglish(string)` and `toBangla(string)`. Used by the parser to normalise `১১-০৪-২০২৬` → `11-04-2026` and `২৮/২০১৮` → `28/2018`.

### 2.2 New file: `backend/app/Domain/Judiciary/CaseTypeCatalog.php`
A const array mapping Bangla registry names observed in the recon to a normalized slug:
```php
'দেওয়ানী আপীল'        => 'civil_appeal',
'ফৌজদারী আপীল'        => 'criminal_appeal',
'দেওয়ানী রিভিশন'      => 'civil_revision',
'ফৌজদারী রিভিশন'      => 'criminal_revision',
'ফৌজদারী বিবিধ মামলা'  => 'criminal_misc',
'অর্পিত আপীল'          => 'entrusted_appeal',
'মিস লুনাসি'          => 'misc_lunacy',
// ... extend as we encounter more
```
Case form dropdown uses this list. Normalisation trims trailing spaces.

---

## Phase 3 — New `Judiciary` domain

Create `backend/app/Domain/Judiciary/` (new domain, keeps existing `Courts` domain clean).

### 3.1 New file: `Domain/Judiciary/Dto/CauseListRow.php`
Plain readonly DTO: `caseTypeBn, caseSerial, caseYear, activity, nextDate (Carbon|null), briefOrder, serial`.

### 3.2 New file: `Domain/Judiciary/Actions/ParseCauseListHtmlAction.php`
Pure function. Takes HTML string, returns `Collection<CauseListRow>`. No I/O, no DB. Uses DomCrawler to read `tbody tr`, splits `<span>X</span> - Y/Z` for type/serial/year, normalises digits.

### 3.3 New file: `Domain/Judiciary/Actions/FetchCauseListHtmlAction.php`
Wraps `Http::withOptions(['timeout' => 20])->withHeaders(['User-Agent' => 'CaseDex/1.0 (+contact@casedex.app)'])->get(...)`. Returns HTML or throws. Throttled via `Redis::throttle('judiciary', 1, 2s)`.

### 3.4 New file: `Domain/Judiciary/Actions/MatchCauseListRowAction.php`
Given a `CauseListRow` + `Court`, finds cases where:
- `tenant_id` = current tenant (wrapped in `TenantContext::set` at the job level)
- `court_id` = this court
- `registry_case_type_bn` = row.caseTypeBn (or contains/stripped comparison for fuzzy)
- `registry_case_serial` = row.caseSerial
- `registry_case_year` = row.caseYear

Returns matched `CaseFile` collection.

### 3.5 New file: `Domain/Judiciary/Actions/CreateCauseListNotificationAction.php`
For each matched case + participant, creates a `CaseNotification` with `notification_type = 'cause_list_listing'` following the exact pattern from `SendHearingReminders.php`. Uses `firstOrCreate` with `(case_id, user_id, notification_type, scheduled_for)` — idempotent.

Body: `"Your case {type} {serial}/{year} is listed at {court} on {date}. Activity: {activity}. Next date: {nextDate}."` (EN) + Bangla variant.

---

## Phase 4 — Court catalog seeder

### 4.1 New file: `Domain/Judiciary/Actions/SeedJudiciaryCourtsAction.php`
One-shot operation:
1. Hit `/api?path=geo/divisions` → populate `court_divisions` if missing
2. Hit `/api?path=geo/districts` → populate `court_districts`
3. For each (district × origin), hit `/api?path=courts&district_id=X&office_origin_id=Y` → upsert `courts` rows keyed on `judiciary_portal_court_id`

### 4.2 New file: `backend/app/Console/Commands/SeedJudiciaryCourts.php`
`php artisan judiciary:seed-courts` — invokes the action, streams progress. Run once per deploy or on-demand.

---

## Phase 5 — Scraper job & command

### 5.1 New file: `backend/app/Jobs/ScrapeJudiciaryCauseListJob.php`
Queued job. Constructor: `(int $courtId, string $dateYmd, int $tenantId)`.

`handle()`:
1. `TenantContext::set($tenantId)`
2. Find court; if no `judiciary_portal_court_id`, bail
3. Call `FetchCauseListHtmlAction` (throttled)
4. Call `ParseCauseListHtmlAction` → rows
5. For each row, call `MatchCauseListRowAction` → matched cases
6. For each matched case, call `CreateCauseListNotificationAction`
7. Insert into `judiciary_causelist_logs`
8. `TenantContext::clear()` in `finally`

Retries: 3, backoff `[60, 300, 900]` seconds.

### 5.2 New file: `backend/app/Console/Commands/ScrapeJudiciaryCauseList.php`
`php artisan judiciary:scrape-causelist {--date=} {--court-id=}`.

Without flags: finds tomorrow's date, then for each tenant with active cases that have `registry_case_*` filled in, groups by court_id, and dispatches one job per (tenant, court). Options for manual backfill.

### 5.3 Modify: `backend/routes/console.php`
```php
Schedule::command('judiciary:scrape-causelist')
    ->dailyAt('04:30')
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping();
```

---

## Phase 6 — Frontend

### 6.1 Modify: `frontend/app/(workspace)/cases/new/page.tsx`
Add a new collapsible "Court registry (optional)" card below the client card:
- Court selector (existing `useCourts()` hook if it exists, else new)
- Case type dropdown (hardcoded list from `CaseTypeCatalog` mirrored in TS)
- Serial number (number input)
- Year (number input, default current year)

Zod schema: all four optional, but if any filled then all four required (refine).

### 6.2 Modify: `frontend/app/(workspace)/cases/[publicId]/page.tsx`
Show a "Registry" pill/badge on the case detail header. If `registry_case_*` present, show a small section "Registered at {court} as {type} {serial}/{year}" plus a "View on judiciary.gov.bd" external link.

### 6.3 Modify: `frontend/app/(workspace)/layout.tsx`
`notificationHref()` helper — add branch: if `type.includes("cause_list")`, navigate to the linked case.

### 6.4 Modify: `frontend/lib/i18n.ts`
New keys: `cases.registry.*` (section title, field labels, help text), `notifications.cause_list.*` (title, body template), `common.optional`.

### 6.5 *(Optional, Phase 1.5)* — new page `/causelist`
A dashboard listing recent matches: date, court, matched case, activity. Skip unless desired — the notification feed already covers it.

---

## Phase 7 — Tests

### 7.1 Parser tests (no network)
**New file:** `backend/tests/Unit/Judiciary/ParseCauseListHtmlActionTest.php`

**New fixture:** `backend/tests/fixtures/judiciary/causelist_munshiganj_59.html` — save the real HTML we pulled in recon.

Assertions:
- 38 rows parsed
- Row 1: type=`অর্পিত আপীল`, serial=28, year=2018, nextDate=2026-07-01
- Row 2: nextDate is null (empty cell), briefOrder contains `বদলী`
- Bangla digits converted correctly

### 7.2 Matcher test
**New file:** `backend/tests/Feature/Judiciary/MatchCauseListRowActionTest.php`
- Seed a tenant + court + case with registry fields
- Construct a `CauseListRow` matching it
- Assert the action returns the case

### 7.3 Scraper job test with HTTP faking
**New file:** `backend/tests/Feature/Judiciary/ScrapeJudiciaryCauseListJobTest.php`
- `Http::fake(['causelist.judiciary.gov.bd/*' => Http::response(file_get_contents(fixture))])`
- Dispatch job, assert notifications + log row created

### 7.4 Bangla digits unit test
`backend/tests/Unit/Support/BanglaDigitsTest.php`

---

## Phase 8 — OPERATIONS.md update

Add an "External integrations" section noting:
- Where the User-Agent points
- How to run `judiciary:seed-courts` on first deploy
- Expected daily job volume (estimate: N tenants × avg 3 courts = ~hundreds of HTTP requests/day — well under any reasonable rate limit)
- What to do if the portal changes HTML structure (re-record fixture, fix parser)

---

## File summary

### New backend files (19)

| File | Purpose |
|---|---|
| `migrations/..._add_judiciary_fields_to_courts_table.php` | FK to portal |
| `migrations/..._add_registry_fields_to_cases_table.php` | Structured case key |
| `migrations/..._create_judiciary_causelist_logs_table.php` | Audit log |
| `app/Support/BanglaDigits.php` | Digit converter |
| `app/Domain/Judiciary/CaseTypeCatalog.php` | Bangla→slug dictionary |
| `app/Domain/Judiciary/Dto/CauseListRow.php` | Parsed row DTO |
| `app/Domain/Judiciary/Actions/FetchCauseListHtmlAction.php` | HTTP fetch |
| `app/Domain/Judiciary/Actions/ParseCauseListHtmlAction.php` | HTML parser |
| `app/Domain/Judiciary/Actions/MatchCauseListRowAction.php` | DB match |
| `app/Domain/Judiciary/Actions/CreateCauseListNotificationAction.php` | Notify |
| `app/Domain/Judiciary/Actions/SeedJudiciaryCourtsAction.php` | Court seeder |
| `app/Jobs/ScrapeJudiciaryCauseListJob.php` | Queued scraper |
| `app/Console/Commands/SeedJudiciaryCourts.php` | `judiciary:seed-courts` |
| `app/Console/Commands/ScrapeJudiciaryCauseList.php` | `judiciary:scrape-causelist` |
| `tests/fixtures/judiciary/causelist_munshiganj_59.html` | Real HTML fixture |
| `tests/Unit/Judiciary/ParseCauseListHtmlActionTest.php` | Parser tests |
| `tests/Feature/Judiciary/MatchCauseListRowActionTest.php` | Matcher test |
| `tests/Feature/Judiciary/ScrapeJudiciaryCauseListJobTest.php` | E2E job test |
| `tests/Unit/Support/BanglaDigitsTest.php` | Digit helper test |

### Modified backend files (2)
`composer.json`, `routes/console.php`

### New/modified frontend files (4)
`cases/new/page.tsx`, `cases/[publicId]/page.tsx`, `layout.tsx` (notificationHref), `lib/i18n.ts`

### Docs
`OPERATIONS.md`

---

## Open questions before starting

1. **Auto-hearing creation** — proposal is Phase 1 = notification only. Do we want auto-hearing creation instead/also? (Recommendation: notify-only is safer — the "next date" column is often blank or ambiguous.)
2. **Scope of court seeding** — seed *all* courts nationwide (~1000s of rows) or only on-demand as users pick districts? (Recommendation: seed everything once — it's small and enables the dropdown UX.)
3. **Case type dictionary** — start with the ~8 types seen in recon and expand as we encounter more? Or enumerate more exhaustively during seeding? (Recommendation: start with 8, log unknown types as warnings, expand iteratively.)
4. **Tenant scoping of the scraper** — one job per (tenant, court) combination, or one job per court that iterates all tenants? (Recommendation: one per (tenant, court) — cleaner, reuses `TenantContext` pattern from `SendHearingReminders`.)
5. **Branch name** — `feature/judiciary-causelist-integration`?
