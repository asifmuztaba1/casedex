<?php

use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * docs/openapi.json is generated from the routes, Form Requests and API
 * Resources (Scramble). Generating it here gives a fixed environment: the
 * migrated test schema and a tenant context, which some rules() read.
 *
 * After changing the API, refresh it with:
 *   UPDATE_OPENAPI=1 php artisan test --filter=OpenApiSpecTest
 */
it('keeps docs/openapi.json in sync with the code', function (): void {
    $committedPath = base_path('../docs/openapi.json');
    $generatedPath = tempnam(sys_get_temp_dir(), 'openapi');

    TenantContext::set(1);
    try {
        $this->artisan('scramble:export', ['--path' => $generatedPath])->assertSuccessful();
    } finally {
        TenantContext::clear();
    }

    $generated = (string) file_get_contents($generatedPath);
    unlink($generatedPath);

    if (env('UPDATE_OPENAPI')) {
        file_put_contents($committedPath, $generated."\n");
    }

    expect(file_exists($committedPath))->toBeTrue('docs/openapi.json is missing.');
    expect(rtrim((string) file_get_contents($committedPath)) === rtrim($generated))->toBeTrue(
        'docs/openapi.json is out of date. Run: UPDATE_OPENAPI=1 php artisan test --filter=OpenApiSpecTest'
    );
});

it('documents every mobile endpoint with Bearer auth', function (): void {
    $spec = json_decode((string) file_get_contents(base_path('../docs/openapi.json')), true);

    expect(array_keys($spec['paths']))->toContain(
        '/mobile/login', '/mobile/register', '/mobile/token/refresh', '/mobile/logout',
        '/mobile/devices', '/mobile/devices/{publicId}', '/mobile/push-token', '/devices',
    );
    expect($spec['components']['securitySchemes'])->toContain(['type' => 'http', 'scheme' => 'bearer']);
    expect(collect(array_keys($spec['paths']))->filter(fn (string $path): bool => str_starts_with($path, '/admin')))->toBeEmpty();
});
