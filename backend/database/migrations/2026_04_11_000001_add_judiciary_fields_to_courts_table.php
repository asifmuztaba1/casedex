<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courts', function (Blueprint $table): void {
            $table->unsignedInteger('judiciary_portal_court_id')->nullable()->after('court_type_id');
            $table->unsignedInteger('judiciary_portal_origin_id')->nullable()->after('judiciary_portal_court_id');
            $table->timestamp('last_causelist_synced_at')->nullable()->after('is_active');

            $table->unique('judiciary_portal_court_id', 'courts_portal_court_id_unique');
            $table->index('judiciary_portal_origin_id');
        });
    }

    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table): void {
            $table->dropUnique('courts_portal_court_id_unique');
            $table->dropIndex(['judiciary_portal_origin_id']);
            $table->dropColumn([
                'judiciary_portal_court_id',
                'judiciary_portal_origin_id',
                'last_causelist_synced_at',
            ]);
        });
    }
};
