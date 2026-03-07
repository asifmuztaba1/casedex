<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manual_subscription_change_requests', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('requested_by')->constrained('users');
            $table->enum('type', ['cancel', 'plan_change']);
            $table->enum('current_plan', array_column(TenantPlan::cases(), 'value'))->nullable();
            $table->enum('current_interval', ['monthly', 'yearly'])->nullable();
            $table->enum('requested_plan', array_column(TenantPlan::cases(), 'value'))->nullable();
            $table->enum('requested_interval', ['monthly', 'yearly'])->nullable();
            $table->timestamp('effective_at');
            $table->enum('status', ['pending', 'approved', 'rejected', 'applied'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'effective_at'], 'manual_sub_change_tenant_status_effective_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manual_subscription_change_requests');
    }
};
