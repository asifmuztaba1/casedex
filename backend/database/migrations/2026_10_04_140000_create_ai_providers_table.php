<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI provider settings chosen by CaseDex platform admins (Admin → AI),
 * replacing .env-only configuration. Platform-wide, not per workspace.
 * One row per known provider; at most one is active. API keys are stored
 * encrypted with APP_KEY.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_providers', function (Blueprint $table): void {
            $table->id();
            // gemini | groq | openai | openrouter
            $table->string('provider', 32)->unique();
            $table->string('model', 120);
            $table->string('base_url')->nullable();
            $table->text('api_key')->nullable();
            $table->boolean('is_active')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_tested_at')->nullable();
            $table->boolean('last_test_ok')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_providers');
    }
};
