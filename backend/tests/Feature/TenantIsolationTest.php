<?php

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('does not expose cases across tenants', function (): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $userA = User::factory()->create([
        'tenant_id' => $tenantA->id,
    ]);

    $userB = User::factory()->create([
        'tenant_id' => $tenantB->id,
    ]);

    $caseA = CaseFile::create([
        'tenant_id' => $tenantA->id,
        'title' => 'Tenant A Case',
        'court' => 'High Court',
        'story' => 'Story A',
        'petition_draft' => 'Draft A',
        'created_by' => $userA->id,
    ]);

    Sanctum::actingAs($userB);

    $listResponse = $this->getJson('/api/v1/cases');
    $listResponse->assertOk();
    expect($listResponse->json('data'))->toBeArray()->toHaveCount(0);

    $showResponse = $this->getJson('/api/v1/cases/'.$caseA->public_id);
    $showResponse->assertNotFound();
});

it('scopes push subscriptions to the authenticated user', function (): void {
    $tenant = Tenant::factory()->create();
    $userA = User::factory()->create(['tenant_id' => $tenant->id]);
    $userB = User::factory()->create(['tenant_id' => $tenant->id]);

    PushSubscription::create([
        'tenant_id' => $tenant->id,
        'user_id' => $userA->id,
        'endpoint' => 'https://example.test/push/a',
        'endpoint_hash' => hash('sha256', 'https://example.test/push/a'),
        'p256dh_key' => 'p256dh-key-a',
        'auth_key' => 'auth-key-a',
        'content_encoding' => 'aes128gcm',
    ]);

    Sanctum::actingAs($userB);

    $listResponse = $this->getJson('/api/v1/push-subscriptions');
    $listResponse->assertOk();
    expect($listResponse->json('data'))->toBeArray()->toHaveCount(0);
});
