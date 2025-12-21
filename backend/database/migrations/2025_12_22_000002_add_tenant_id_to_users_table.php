<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('tenant_id')->nullable()->constrained('tenants');
            $table->ulid('public_id')->unique()->nullable();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'created_at']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn('public_id');
        });
    }
};
