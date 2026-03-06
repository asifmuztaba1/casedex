<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_manual_payment_requests', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->foreignId('ai_credit_pack_id')->constrained('ai_credit_packs');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 8)->default('BDT');
            $table->string('sender_number', 32);
            $table->string('transaction_id', 128)->unique();
            $table->timestamp('sent_at');
            $table->string('screenshot_disk', 32)->default('local');
            $table->string('screenshot_path');
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'created_at'], 'ai_manual_payments_tenant_status_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_manual_payment_requests');
    }
};
