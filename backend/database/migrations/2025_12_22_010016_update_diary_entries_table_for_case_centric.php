<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->foreignId('hearing_id')->nullable()->constrained('hearings')->after('case_id');
            $table->timestamp('entry_at')->nullable()->after('public_id');
            $table->string('title')->nullable()->after('entry_at');
            $table->longText('body')->nullable()->after('title');
            $table->foreignId('created_by')->nullable()->constrained('users')->after('body');
        });

        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->dropColumn(['entry_date', 'content']);
        });
    }

    public function down(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->date('entry_date');
            $table->longText('content');
            $table->dropColumn(['hearing_id', 'entry_at', 'title', 'body', 'created_by']);
        });
    }
};
