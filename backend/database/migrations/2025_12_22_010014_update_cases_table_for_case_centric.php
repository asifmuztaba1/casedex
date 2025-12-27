<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->string('court')->nullable()->after('title');
            $table->string('case_number')->nullable()->after('court');
            $table->foreignId('client_id')->nullable()->constrained('clients')->after('case_number');
            $table->longText('story')->nullable()->after('client_id');
            $table->longText('petition_draft')->nullable()->after('story');
            $table->foreignId('created_by')->nullable()->constrained('users')->after('petition_draft');
        });

        Schema::table('cases', function (Blueprint $table): void {
            $table->dropColumn(['reference', 'summary']);
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->string('reference')->nullable();
            $table->text('summary')->nullable();
            $table->dropColumn(['court', 'case_number', 'client_id', 'story', 'petition_draft', 'created_by']);
        });
    }
};
