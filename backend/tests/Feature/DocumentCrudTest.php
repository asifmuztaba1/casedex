<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile as RealUploadedFile;

uses(RefreshDatabase::class);

/**
 * A real temp file, so its type is detected from the content the way production
 * uploads are. Laravel's fake files report a type based on the file name.
 */
function uploadWithContent(string $name, string $content): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'upload');
    file_put_contents($path, $content);

    return UploadedFile::createFromBase(new RealUploadedFile($path, $name, null, null, true), true);
}

function createDocTestUser(): User
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

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
    ]);
}

function createDocTestCase(User $user): string
{
    $response = test()->actingAs($user)->postJson('/api/v1/cases', [
        'title' => 'Doc Test Case',
        'court' => 'District Court',
        'story' => 'Test story for documents',
        'petition_draft' => 'Test draft',
        'client' => ['name' => 'Test Client'],
    ]);

    return $response->json('data.public_id');
}

it('uploads a document to a case', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->create('petition.pdf', 100, 'application/pdf'),
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.category', 'petition');
});

it('lists documents for a case', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'evidence',
        'file' => UploadedFile::fake()->create('evidence.pdf', 50, 'application/pdf'),
    ]);

    $response = $this->getJson("/api/v1/cases/{$casePublicId}/documents");
    $response->assertOk();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('lists all documents across cases', function (): void {
    $user = createDocTestUser();
    $this->actingAs($user);

    $response = $this->getJson('/api/v1/documents');
    $response->assertOk();
});

it('deletes a document', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'order_sheet',
        'file' => UploadedFile::fake()->create('order.pdf', 80, 'application/pdf'),
    ]);
    $createResponse->assertStatus(201);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->deleteJson("/api/v1/documents/{$publicId}");
    $response->assertNoContent();
});

it('rejects upload without file', function (): void {
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
    ]);

    $response->assertUnprocessable();
});

it('accepts PDF, JPG and PNG uploads', function (string $name, string $mime): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->create($name, 40, $mime),
    ])->assertCreated();
})->with([
    'pdf' => ['petition.pdf', 'application/pdf'],
    'jpg' => ['hearing-order.jpg', 'image/jpeg'],
    'jpeg' => ['scan.jpeg', 'image/jpeg'],
    'png' => ['screenshot.png', 'image/png'],
]);

it('rejects any other file type, judged by the file content', function (string $name, string $content): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => uploadWithContent($name, $content),
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file' => 'Upload a PDF, JPG or PNG file.']);

    expect(Storage::allFiles())->toBeEmpty();
})->with([
    'web page' => ['notes.html', '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>'],
    'svg image' => ['seal.svg', '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    'web page renamed to .pdf' => ['petition.pdf', '<!DOCTYPE html><html><body>not a pdf</body></html>'],
    'plain text' => ['notes.txt', 'Hearing adjourned to next week.'],
]);

it('rejects a replacement file of another type', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $publicId = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->create('petition.pdf', 40, 'application/pdf'),
    ])->assertCreated()->json('data.public_id');

    $this->putJson("/api/v1/documents/{$publicId}", [
        'file' => uploadWithContent('petition.html', '<!DOCTYPE html><html></html>'),
    ])->assertUnprocessable()->assertJsonValidationErrors(['file']);
});

it('explains the allowed file types in Bangla', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $user->update(['locale' => 'bn']);
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => uploadWithContent('notes.html', '<!DOCTYPE html><html></html>'),
    ])->assertJsonValidationErrors(['file' => 'পিডিএফ, জেপিজি বা পিএনজি ফাইল আপলোড করুন।']);
});
