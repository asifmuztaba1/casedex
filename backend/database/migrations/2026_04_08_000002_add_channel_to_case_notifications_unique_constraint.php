<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->dropUnique('case_notifications_unique_reminder');
        });

        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->unique([
                'tenant_id',
                'hearing_id',
                'user_id',
                'notification_type',
                'channel',
                'scheduled_for',
            ], 'case_notifications_unique_reminder');
        });
    }

    public function down(): void
    {
        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->dropUnique('case_notifications_unique_reminder');
        });

        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->unique([
                'tenant_id',
                'hearing_id',
                'user_id',
                'notification_type',
                'scheduled_for',
            ], 'case_notifications_unique_reminder');
        });
    }
};
