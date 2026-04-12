<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\ScrapeJudiciaryCauseListJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function setupJobFixtures(): array
{
    $country = Country::query()->firstOrCreate(
        ['code' => 'BD'],
        ['name' => 'Bangladesh', 'active' => true]
    );

    $tenant = Tenant::factory()->create([
        'country_id' => $country->id,
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
    ]);

    $division = CourtDivision::query()->firstOrCreate(
        ['country_id' => $country->id, 'name' => 'Job Test Division'],
        ['name_bn' => 'টেস্ট বিভাগ']
    );
    $district = CourtDistrict::query()->firstOrCreate(
        ['country_id' => $country->id, 'division_id' => $division->id, 'name' => 'Job Test District'],
        ['name_bn' => 'টেস্ট জেলা']
    );
    $courtType = CourtType::query()->firstOrCreate(
        ['country_id' => $country->id, 'name' => 'Job Test Court Type'],
        ['name_bn' => 'টেস্ট ধরণ']
    );

    $court = Court::query()->create([
        'country_id' => $country->id,
        'division_id' => $division->id,
        'district_id' => $district->id,
        'court_type_id' => $courtType->id,
        'judiciary_portal_court_id' => 59,
        'name' => 'Job Test Court '.uniqid(),
        'name_bn' => 'টেস্ট আদালত',
        'is_active' => true,
    ]);

    TenantContext::set($tenant->id);
    $case = CaseFile::query()->create([
        'tenant_id' => $tenant->id,
        'title' => 'Scraped Match Case',
        'court' => $court->name,
        'court_id' => $court->id,
        'registry_case_type_bn' => 'অর্পিত আপীল',
        'registry_case_serial' => 28,
        'registry_case_year' => 2018,
        'created_by' => $user->id,
    ]);
    TenantContext::clear();

    return [$tenant, $user, $court, $case];
}

it('scrapes causelist, matches cases, and writes notifications + log entry', function () {
    [$tenant, $user, $court, $case] = setupJobFixtures();

    $html = file_get_contents(__DIR__.'/../../fixtures/judiciary/causelist_munshiganj_59.html');
    Http::fake([
        'causelist.judiciary.gov.bd/causelist*' => Http::response($html, 200),
    ]);

    (new ScrapeJudiciaryCauseListJob(
        tenantId: $tenant->id,
        courtId: $court->id,
        dateYmd: '2026-04-08',
    ))->handle(
        app(\App\Domain\Judiciary\Actions\FetchCauseListHtmlAction::class),
        app(\App\Domain\Judiciary\Actions\ParseCauseListHtmlAction::class),
        app(\App\Domain\Judiciary\Actions\MatchCauseListRowAction::class),
        app(\App\Domain\Judiciary\Actions\CreateCauseListNotificationAction::class),
    );

    $log = DB::table('judiciary_causelist_logs')
        ->where('tenant_id', $tenant->id)
        ->where('court_id', $court->id)
        ->where('cause_list_date', '2026-04-08')
        ->first();

    expect($log)->not->toBeNull();
    expect($log->status)->toBe('ok');
    expect((int) $log->row_count)->toBe(38);
    expect((int) $log->match_count)->toBe(1);
    expect((int) $log->notification_count)->toBe(1);

    TenantContext::set($tenant->id);
    $notif = CaseNotification::query()
        ->where('case_id', $case->id)
        ->where('notification_type', 'cause_list_listing')
        ->first();
    TenantContext::clear();

    expect($notif)->not->toBeNull();
    expect($notif->channel)->toBe('in_app');
    expect($notif->user_id)->toBe($user->id);

    expect($court->fresh()->last_causelist_synced_at)->not->toBeNull();
});

it('logs empty status when no rows are returned', function () {
    [$tenant, $user, $court] = setupJobFixtures();

    Http::fake([
        'causelist.judiciary.gov.bd/causelist*' => Http::response('<html><body><table><tbody></tbody></table></body></html>', 200),
    ]);

    (new ScrapeJudiciaryCauseListJob(
        tenantId: $tenant->id,
        courtId: $court->id,
        dateYmd: '2026-04-08',
    ))->handle(
        app(\App\Domain\Judiciary\Actions\FetchCauseListHtmlAction::class),
        app(\App\Domain\Judiciary\Actions\ParseCauseListHtmlAction::class),
        app(\App\Domain\Judiciary\Actions\MatchCauseListRowAction::class),
        app(\App\Domain\Judiciary\Actions\CreateCauseListNotificationAction::class),
    );

    $log = DB::table('judiciary_causelist_logs')
        ->where('tenant_id', $tenant->id)
        ->where('court_id', $court->id)
        ->first();

    expect($log->status)->toBe('empty');
    expect((int) $log->match_count)->toBe(0);
});
