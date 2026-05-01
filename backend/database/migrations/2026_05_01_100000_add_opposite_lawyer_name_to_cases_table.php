<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->string('opposite_lawyer_name', 200)->nullable()->after('petition_draft');
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->dropColumn('opposite_lawyer_name');
        });
    }
};
