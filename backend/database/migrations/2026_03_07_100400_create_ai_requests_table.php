<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_requests', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('feature', 64);
            $table->string('status', 64)->default('queued');
            $table->string('idempotency_key', 120);
            $table->unsignedInteger('credits_cost')->default(0);
            $table->boolean('credits_refunded')->default(false);
            $table->json('request_payload');
            $table->longText('result_text')->nullable();
            $table->json('result_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'idempotency_key'], 'ai_requests_tenant_idempotency_unique');
            $table->index(['tenant_id', 'status', 'created_at'], 'ai_requests_tenant_status_created_idx');
            $table->index(['tenant_id', 'feature', 'created_at'], 'ai_requests_tenant_feature_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_requests');
    }
};
