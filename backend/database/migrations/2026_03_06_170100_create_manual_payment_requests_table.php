<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manual_payment_requests', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->enum('plan', array_column(TenantPlan::cases(), 'value'));
            $table->enum('interval', ['monthly', 'yearly']);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 8)->default('BDT');
            $table->string('sender_number', 32);
            $table->string('transaction_id', 128)->unique();
            $table->timestamp('sent_at');
            $table->string('screenshot_disk', 32)->default('local');
            $table->string('screenshot_path');
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired'])->default('pending');
            $table->timestamp('temporary_access_expires_at')->nullable();
            $table->timestamp('approved_starts_at')->nullable();
            $table->timestamp('approved_ends_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'created_at'], 'manual_requests_tenant_status_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manual_payment_requests');
    }
};
