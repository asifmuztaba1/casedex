<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->string('registry_case_type_bn')->nullable()->after('case_number');
            $table->unsignedInteger('registry_case_serial')->nullable()->after('registry_case_type_bn');
            $table->unsignedSmallInteger('registry_case_year')->nullable()->after('registry_case_serial');

            $table->index(
                ['court_id', 'registry_case_type_bn', 'registry_case_serial', 'registry_case_year'],
                'cases_registry_lookup_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table): void {
            $table->dropIndex('cases_registry_lookup_idx');
            $table->dropColumn([
                'registry_case_type_bn',
                'registry_case_serial',
                'registry_case_year',
            ]);
        });
    }
};
