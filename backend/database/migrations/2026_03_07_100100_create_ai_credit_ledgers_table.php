<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_credit_ledgers', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('event_type', 64);
            $table->string('feature', 64)->nullable();
            $table->integer('credits_delta');
            $table->integer('free_delta')->default(0);
            $table->integer('paid_delta')->default(0);
            $table->unsignedInteger('free_balance_after');
            $table->unsignedInteger('paid_balance_after');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'created_at'], 'ai_ledger_tenant_created_idx');
            $table->index(['tenant_id', 'event_type', 'created_at'], 'ai_ledger_tenant_event_created_idx');
            $table->index(['tenant_id', 'user_id', 'created_at'], 'ai_ledger_tenant_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_credit_ledgers');
    }
};
