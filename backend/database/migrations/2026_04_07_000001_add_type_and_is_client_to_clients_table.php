<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('type', 20)->default('person')->after('notes');
            $table->boolean('is_client')->default(true)->after('type');
            $table->index(['tenant_id', 'is_client']);
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_client']);
            $table->dropColumn(['type', 'is_client']);
        });
    }
};
