<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Voice junior associate (prototype, decided 2026-10-04): switched on per
 * firm by platform admins; each conversation is recorded so its real length
 * can be billed from AI credits.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->boolean('voice_associate_enabled')->default(false);
        });

        Schema::create('voice_sessions', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('user_id')->constrained('users');
            // ElevenLabs conversation id, used to read the call length for billing.
            $table->string('conversation_id', 100)->nullable()->unique();
            // started | ended | billed | failed
            $table->string('status', 16)->default('started');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('credits_charged')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['status', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voice_sessions');
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn('voice_associate_enabled');
        });
    }
};
