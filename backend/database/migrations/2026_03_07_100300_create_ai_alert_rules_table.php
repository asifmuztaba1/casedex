<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_alert_rules', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->unsignedInteger('threshold_credits');
            $table->boolean('channel_in_app')->default(true);
            $table->boolean('channel_email')->default(true);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active', 'threshold_credits'], 'ai_alert_rules_tenant_active_threshold_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_alert_rules');
    }
};
