<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A zip of a workspace's cases and documents, built in the background and
 * delivered as an expiring signed link (data portability; also offered
 * before a workspace is deleted with its last member's account).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_exports', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            // pending | ready | failed | expired
            $table->string('status', 16)->default('pending');
            // manual | account_deletion
            $table->string('reason', 32)->default('manual');
            $table->string('path')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_exports');
    }
};
