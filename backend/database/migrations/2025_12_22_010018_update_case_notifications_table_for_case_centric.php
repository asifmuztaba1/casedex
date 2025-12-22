<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->constrained('users')->after('case_id');
            $table->foreignId('hearing_id')->nullable()->constrained('hearings')->after('user_id');
            $table->string('notification_type')->default('general')->after('hearing_id');
            $table->string('channel')->default('in_app')->after('notification_type');
            $table->timestamp('sent_at')->nullable()->after('scheduled_for');
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

    public function down(): void
    {
        Schema::table('case_notifications', function (Blueprint $table): void {
            $table->dropUnique('case_notifications_unique_reminder');
            $table->dropColumn([
                'user_id',
                'hearing_id',
                'notification_type',
                'channel',
                'sent_at',
            ]);
        });
    }
};
