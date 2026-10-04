<?php

namespace Database\Seeders;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Minimal data for the browser tests (frontend/e2e): countries, courts and a
 * platform admin. Everything else is created through the UI by the tests.
 */
class E2eSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new \RuntimeException('E2eSeeder must not run in production.');
        }

        $this->call(CountriesSeeder::class);
        $this->call(BangladeshCourtSeeder::class);

        User::query()->updateOrCreate(
            ['email' => env('E2E_ADMIN_EMAIL', 'e2e-admin@example.test')],
            [
                'name' => 'E2E Platform Admin',
                'password' => env('E2E_ADMIN_PASSWORD', 'E2e#Admin2026pass'),
                'role' => UserRole::PlatformAdmin,
                'tenant_id' => null,
                'email_verified_at' => now(),
            ],
        );
    }
}
