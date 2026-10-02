<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sanctum personal access tokens, one per signed-in mobile device. The web
 * app keeps using cookie sessions; these are only issued by /mobile/login
 * and /mobile/register. Each row can carry the device's FCM push token.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            // ios | android
            $table->string('platform', 16)->nullable();
            $table->text('push_token')->nullable();
            // sha256 of push_token: one physical device keeps one registration.
            $table->char('push_token_hash', 64)->nullable()->unique();
            $table->timestamp('push_token_updated_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
