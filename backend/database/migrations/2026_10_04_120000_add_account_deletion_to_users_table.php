<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Account deletion (decided 2026-10-03): a request schedules erasure 30 days
 * out; signing in before then cancels it. Erased users are anonymised in
 * place so the firm's records and audit history keep a "Deleted user".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('deletion_requested_at')->nullable();
            $table->timestamp('deletion_scheduled_for')->nullable()->index();
            $table->timestamp('anonymised_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['deletion_scheduled_for']);
            $table->dropColumn(['deletion_requested_at', 'deletion_scheduled_for', 'anonymised_at']);
        });
    }
};
