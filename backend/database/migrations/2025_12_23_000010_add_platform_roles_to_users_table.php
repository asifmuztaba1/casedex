<?php

use App\Domain\Auth\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $roles = implode("','", UserRole::allValues());
        DB::statement("ALTER TABLE users MODIFY role ENUM('{$roles}') NOT NULL DEFAULT '".UserRole::Assistant->value."'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $roles = implode("','", UserRole::tenantRoles());
        DB::statement("ALTER TABLE users MODIFY role ENUM('{$roles}') NOT NULL DEFAULT '".UserRole::Assistant->value."'");
    }
};
