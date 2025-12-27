<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->enum('plan', array_column(TenantPlan::cases(), 'value'))
                ->default(TenantPlan::Free->value)
                ->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn('plan');
        });
    }
};
