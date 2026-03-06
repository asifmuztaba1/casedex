<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tenants', 'trial_ends_at')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->timestamp('trial_ends_at')->nullable()->after('plan');
            });
        }

        DB::table('tenants')
            ->where('plan', 'free')
            ->update(['plan' => TenantPlan::Trial->value]);

        DB::table('tenants')
            ->where('plan', 'premium')
            ->update(['plan' => TenantPlan::Professional->value]);

        DB::table('tenants')
            ->where('plan', TenantPlan::Trial->value)
            ->whereNull('trial_ends_at')
            ->update(['trial_ends_at' => now()->addDays((int) config('billing.trial_days', 30))]);

        if (DB::getDriverName() === 'mysql') {
            $plans = implode("','", array_column(TenantPlan::cases(), 'value'));
            DB::statement("ALTER TABLE tenants MODIFY plan ENUM('{$plans}') NOT NULL DEFAULT '".TenantPlan::Trial->value."'");
        }
    }

    public function down(): void
    {
        DB::table('tenants')
            ->where('plan', TenantPlan::Trial->value)
            ->update(['plan' => 'free']);

        DB::table('tenants')
            ->where('plan', TenantPlan::Starter->value)
            ->update(['plan' => 'premium']);

        DB::table('tenants')
            ->where('plan', TenantPlan::Professional->value)
            ->update(['plan' => 'premium']);

        DB::table('tenants')
            ->where('plan', TenantPlan::Chambers->value)
            ->update(['plan' => 'premium']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tenants MODIFY plan ENUM('free','premium') NOT NULL DEFAULT 'free'");
        }

        if (Schema::hasColumn('tenants', 'trial_ends_at')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->dropColumn('trial_ends_at');
            });
        }
    }
};
