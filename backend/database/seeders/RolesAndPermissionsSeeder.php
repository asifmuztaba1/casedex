<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions
        $permissions = [
            // Cases
            'cases.view',
            'cases.create',
            'cases.update',
            'cases.delete',

            // Hearings
            'hearings.view',
            'hearings.create',
            'hearings.update',
            'hearings.delete',

            // Diary
            'diary.view',
            'diary.create',
            'diary.update',
            'diary.delete',

            // Documents
            'documents.view',
            'documents.upload',
            'documents.delete',

            // Research
            'research.view',
            'research.create',
            'research.update',
            'research.delete',

            // Notifications
            'notifications.view',
            'notifications.manage',

            // Team
            'team.view',
            'team.manage',

            // Clients
            'clients.view',
            'clients.create',
            'clients.update',
            'clients.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Admin — full access
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions($permissions);

        // Lawyer — full case work, no team management
        $lawyer = Role::firstOrCreate(['name' => 'lawyer', 'guard_name' => 'web']);
        $lawyer->syncPermissions(array_filter($permissions, fn ($p) => ! str_starts_with($p, 'team.')));

        // Associate — create and view, no delete
        $associate = Role::firstOrCreate(['name' => 'associate', 'guard_name' => 'web']);
        $associate->syncPermissions(array_filter($permissions, fn ($p) => ! str_contains($p, '.delete') && ! str_starts_with($p, 'team.')));

        // Assistant — view and create documents/diary, no case management
        $assistant = Role::firstOrCreate(['name' => 'assistant', 'guard_name' => 'web']);
        $assistant->syncPermissions([
            'cases.view',
            'hearings.view',
            'diary.view',
            'diary.create',
            'documents.view',
            'documents.upload',
            'research.view',
            'notifications.view',
            'clients.view',
        ]);

        // Viewer — read only
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions(array_filter($permissions, fn ($p) => str_contains($p, '.view')));

        // Platform roles
        Role::firstOrCreate(['name' => 'platform_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'platform_editor', 'guard_name' => 'web']);
    }
}
