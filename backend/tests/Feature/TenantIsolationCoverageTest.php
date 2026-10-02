<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;

/*
 * AGENTS.md §5: every tenant-scoped endpoint must deny cross-tenant access.
 * Tenant A creates one of everything; tenant B then tries to list, read,
 * change, delete, or link to it.
 */

uses(RefreshDatabase::class);

function isolationUser(string $label): User
{
    $country = Country::query()->firstOrCreate(
        ['code' => 'BD'],
        ['name' => 'Bangladesh', 'active' => true]
    );

    $tenant = Tenant::factory()->create([
        'name' => "Tenant {$label}",
        'country_id' => $country->id,
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
        'name' => "Owner {$label}",
    ]);
}

/**
 * @return array<string, mixed>
 */
function seedTenantA(User $userA): array
{
    test()->actingAs($userA);

    $case = test()->postJson('/api/v1/cases', [
        'title' => 'SECRET-A Case',
        'court' => 'District Court',
        'case_number' => 'SECRET-A-001',
        'client' => [
            'name' => 'SECRET-A Client',
            'phone' => '01700000000',
            'identity_number' => 'SECRET-A-NID',
        ],
    ])->assertCreated()->json('data');

    $hearing = test()->postJson("/api/v1/cases/{$case['public_id']}/hearings", [
        'hearing_at' => now()->addDays(3)->toDateTimeString(),
        'type' => HearingType::Mention->value,
        'agenda' => 'SECRET-A agenda',
    ])->assertCreated()->json('data');

    $diary = test()->postJson("/api/v1/cases/{$case['public_id']}/diary", [
        'case_public_id' => $case['public_id'],
        'entry_at' => now()->toDateTimeString(),
        'title' => 'SECRET-A diary',
        'body' => 'SECRET-A diary body',
    ])->assertCreated()->json('data');

    $document = test()->post("/api/v1/cases/{$case['public_id']}/documents", [
        'category' => 'evidence',
        'original_name' => 'SECRET-A.pdf',
        'file' => UploadedFile::fake()->create('SECRET-A.pdf', 10, 'application/pdf'),
    ], ['Accept' => 'application/json'])->assertCreated()->json('data');

    $note = test()->postJson('/api/v1/research-notes', [
        'title' => 'SECRET-A research',
        'body' => 'SECRET-A research body',
    ])->assertCreated()->json('data');

    $contact = test()->postJson('/api/v1/clients', [
        'name' => 'SECRET-A Contact',
        'identity_number' => 'SECRET-A-CONTACT-NID',
    ])->assertCreated()->json('data');

    $party = test()->postJson("/api/v1/cases/{$case['public_id']}/parties", [
        'name' => 'SECRET-A Opponent',
        'type' => 'person',
        'side' => 'opponent',
    ])->assertCreated()->json('data');

    return compact('case', 'hearing', 'diary', 'document', 'note', 'contact', 'party') + [
        'client_public_id' => test()->getJson("/api/v1/cases/{$case['public_id']}")->json('data.client.public_id'),
        'user_public_id' => $userA->public_id,
    ];
}

function assertNoSecret(TestResponse $response, string $endpoint): void
{
    expect($response->status())->toBeLessThan(500, "{$endpoint} returned {$response->status()}");
    expect($response->getContent())->not->toContain('SECRET-A', "{$endpoint} leaked tenant A data");
}

function assertDenied(TestResponse $response, string $endpoint): void
{
    expect($response->status())->toBeIn([403, 404, 422], "{$endpoint} returned {$response->status()}");
    expect($response->getContent())->not->toContain('SECRET-A', "{$endpoint} leaked tenant A data");
}

beforeEach(function (): void {
    Storage::fake(config('filesystems.default'));
    $this->userA = isolationUser('A');
    $this->userB = isolationUser('B');
    $this->a = seedTenantA($this->userA);
    $this->actingAs($this->userB);
});

it('hides tenant A records from every tenant B list endpoint', function (): void {
    $a = $this->a;
    $from = now()->subDays(30)->toDateString();
    $to = now()->addDays(30)->toDateString();

    foreach ([
        '/api/v1/cases',
        '/api/v1/hearings',
        "/api/v1/hearings/calendar?from={$from}&to={$to}",
        '/api/v1/hearings/daily-register?date='.now()->addDays(3)->toDateString(),
        '/api/v1/diary-entries',
        '/api/v1/documents',
        '/api/v1/research-notes',
        '/api/v1/clients',
        '/api/v1/clients/search?q=SECRET',
        '/api/v1/notifications',
        '/api/v1/users',
        '/api/v1/daily-briefing/today',
    ] as $endpoint) {
        assertNoSecret($this->getJson($endpoint), "GET {$endpoint}");
    }

    expect($a['case']['public_id'])->not->toBeEmpty();
});

it('denies tenant B reading tenant A records by id', function (): void {
    $a = $this->a;

    foreach ([
        "/api/v1/cases/{$a['case']['public_id']}",
        "/api/v1/cases/{$a['case']['public_id']}/hearings",
        "/api/v1/cases/{$a['case']['public_id']}/diary",
        "/api/v1/cases/{$a['case']['public_id']}/documents",
        "/api/v1/cases/{$a['case']['public_id']}/participants",
        "/api/v1/cases/{$a['case']['public_id']}/parties",
        "/api/v1/hearings/{$a['hearing']['public_id']}",
        "/api/v1/diary-entries/{$a['diary']['public_id']}",
        "/api/v1/documents/{$a['document']['public_id']}",
        "/api/v1/research-notes/{$a['note']['public_id']}",
        "/api/v1/clients/{$a['client_public_id']}",
        "/api/v1/clients/{$a['contact']['public_id']}",
    ] as $endpoint) {
        assertDenied($this->getJson($endpoint), "GET {$endpoint}");
    }
});

it('denies tenant B downloading a tenant A document even with a valid signature', function (): void {
    $url = URL::temporarySignedRoute(
        'api.v1.documents.download',
        now()->addMinutes(5),
        ['publicId' => $this->a['document']['public_id']],
        false
    );

    assertDenied($this->get($url, ['Accept' => 'application/json']), 'GET document download');
});

it('denies tenant B changing or deleting tenant A records', function (): void {
    $a = $this->a;
    $case = $a['case']['public_id'];

    $attempts = [
        ['putJson', "/api/v1/cases/{$case}", ['title' => 'hijacked', 'court' => 'X']],
        ['putJson', "/api/v1/hearings/{$a['hearing']['public_id']}", ['agenda' => 'hijacked']],
        ['putJson', "/api/v1/diary-entries/{$a['diary']['public_id']}", ['title' => 'hijacked', 'body' => 'x', 'entry_at' => now()->toDateTimeString()]],
        ['putJson', "/api/v1/documents/{$a['document']['public_id']}", ['category' => 'other']],
        ['putJson', "/api/v1/research-notes/{$a['note']['public_id']}", ['title' => 'hijacked']],
        ['putJson', "/api/v1/clients/{$a['contact']['public_id']}", ['name' => 'hijacked']],
        ['putJson', "/api/v1/cases/{$case}/parties/{$a['party']['public_id']}", ['name' => 'hijacked', 'type' => 'person', 'side' => 'opponent']],
        ['putJson', "/api/v1/users/{$a['user_public_id']}", ['name' => 'hijacked']],
        ['postJson', "/api/v1/cases/{$case}/hearings", ['hearing_at' => now()->addDay()->toDateTimeString(), 'type' => 'mention']],
        ['postJson', "/api/v1/cases/{$case}/diary", ['case_public_id' => $case, 'entry_at' => now()->toDateTimeString(), 'title' => 'x', 'body' => 'x']],
        ['postJson', "/api/v1/cases/{$case}/parties", ['name' => 'x', 'type' => 'person', 'side' => 'opponent']],
        ['postJson', "/api/v1/cases/{$case}/participants", ['user_public_id' => $this->userB->public_id, 'role' => 'associate']],
        ['deleteJson', "/api/v1/cases/{$case}/parties/{$a['party']['public_id']}", []],
        ['deleteJson', "/api/v1/research-notes/{$a['note']['public_id']}", []],
        ['deleteJson', "/api/v1/documents/{$a['document']['public_id']}", []],
        ['deleteJson', "/api/v1/diary-entries/{$a['diary']['public_id']}", []],
        ['deleteJson', "/api/v1/hearings/{$a['hearing']['public_id']}", []],
        ['deleteJson', "/api/v1/clients/{$a['contact']['public_id']}", []],
        ['deleteJson', "/api/v1/cases/{$case}", []],
    ];

    foreach ($attempts as [$method, $endpoint, $payload]) {
        $label = strtoupper(str_replace('Json', '', $method))." {$endpoint}";
        assertDenied($this->{$method}($endpoint, $payload), $label);
    }

    // Everything tenant A owns is untouched.
    $this->actingAs($this->userA);
    $this->getJson("/api/v1/cases/{$case}")
        ->assertOk()
        ->assertJsonPath('data.title', 'SECRET-A Case');
    $this->getJson("/api/v1/research-notes/{$a['note']['public_id']}")->assertOk();
    $this->getJson("/api/v1/documents/{$a['document']['public_id']}")->assertOk();
    $this->getJson("/api/v1/hearings/{$a['hearing']['public_id']}")->assertOk();
    $this->getJson("/api/v1/clients/{$a['contact']['public_id']}")->assertOk();
});

it('rejects tenant B linking its own records to tenant A records', function (): void {
    $a = $this->a;

    $caseB = $this->postJson('/api/v1/cases', [
        'title' => 'Tenant B case',
        'court' => 'District Court',
        'client' => ['name' => 'Tenant B client'],
    ])->assertCreated()->json('data.public_id');

    // Create a case pointing at tenant A's client.
    $this->postJson('/api/v1/cases', [
        'title' => 'Tenant B case 2',
        'court' => 'District Court',
        'client_public_id' => $a['client_public_id'],
    ])->assertUnprocessable()->assertJsonValidationErrors('client_public_id');

    // Re-point an existing case at tenant A's client.
    $this->putJson("/api/v1/cases/{$caseB}", [
        'title' => 'Tenant B case',
        'court' => 'District Court',
        'client_public_id' => $a['contact']['public_id'],
    ])->assertUnprocessable()->assertJsonValidationErrors('client_public_id');
    expect(DB::table('cases')->where('public_id', $caseB)->value('client_id'))
        ->not->toBe(DB::table('clients')->where('public_id', $a['contact']['public_id'])->value('id'));
    assertNoSecret($this->getJson("/api/v1/cases/{$caseB}"), 'GET own case after client_id update');

    // Add a party that references tenant A's contact.
    $this->postJson("/api/v1/cases/{$caseB}/parties", [
        'name' => 'Linked party',
        'type' => 'person',
        'side' => 'opponent',
        'client_public_id' => $a['contact']['public_id'],
    ])->assertUnprocessable()->assertJsonValidationErrors('client_public_id');
    expect(DB::table('case_parties')->where('name', 'Linked party')->exists())->toBeFalse();

    // Re-point an existing party at tenant A's contact.
    $partyB = $this->postJson("/api/v1/cases/{$caseB}/parties", [
        'name' => 'Own party',
        'type' => 'person',
        'side' => 'opponent',
    ])->assertCreated()->json('data.public_id');
    $this->putJson("/api/v1/cases/{$caseB}/parties/{$partyB}", [
        'name' => 'Own party',
        'type' => 'person',
        'side' => 'opponent',
        'client_public_id' => $a['contact']['public_id'],
    ])->assertUnprocessable()->assertJsonValidationErrors('client_public_id');
    expect(DB::table('case_parties')->where('public_id', $partyB)->value('client_id'))->toBeNull();
    assertNoSecret($this->getJson("/api/v1/cases/{$caseB}/parties"), 'GET own parties after party client_id');

    // Add tenant A's user as a participant.
    assertDenied($this->postJson("/api/v1/cases/{$caseB}/participants", [
        'user_public_id' => $a['user_public_id'],
        'role' => 'associate',
    ]), 'POST participant with tenant A user');

    // Attach diary entries and documents to tenant A's hearing.
    $this->postJson("/api/v1/cases/{$caseB}/diary", [
        'case_public_id' => $caseB,
        'hearing_public_id' => $a['hearing']['public_id'],
        'entry_at' => now()->toDateTimeString(),
        'title' => 'Linked diary',
        'body' => 'x',
    ]);
    $this->post("/api/v1/cases/{$caseB}/documents", [
        'category' => 'other',
        'hearing_public_id' => $a['hearing']['public_id'],
        'file' => UploadedFile::fake()->create('b.pdf', 5, 'application/pdf'),
    ], ['Accept' => 'application/json']);
    assertNoSecret($this->getJson('/api/v1/diary-entries'), 'GET own diary after hearing link');
    assertNoSecret($this->getJson('/api/v1/documents'), 'GET own documents after hearing link');

    // Tenant A's data is unchanged.
    $this->actingAs($this->userA);
    $this->getJson("/api/v1/clients/{$a['contact']['public_id']}")
        ->assertOk()
        ->assertJsonPath('data.name', 'SECRET-A Contact');
});
