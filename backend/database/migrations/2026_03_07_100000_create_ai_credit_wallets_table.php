<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_credit_wallets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained('tenants');
            $table->unsignedInteger('free_balance')->default(0);
            $table->unsignedInteger('paid_balance')->default(0);
            $table->unsignedInteger('monthly_free_credits')->default(0);
            $table->timestamp('cycle_starts_at')->nullable();
            $table->timestamp('cycle_ends_at')->nullable();
            $table->timestamp('next_free_grant_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'next_free_grant_at'], 'ai_wallets_tenant_next_grant_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_credit_wallets');
    }
};
