<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Clients, case parties and case participants were addressed by their
 * auto-increment id in API URLs. Give them a ULID public_id like every
 * other tenant record (AGENTS.md §7).
 */
return new class extends Migration
{
    /** @var array<int, string> */
    private array $tables = ['clients', 'case_parties', 'case_participants'];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->ulid('public_id')->nullable()->after('id');
            });

            DB::table($tableName)->whereNull('public_id')->orderBy('id')->chunkById(500, function ($rows) use ($tableName): void {
                foreach ($rows as $row) {
                    DB::table($tableName)->where('id', $row->id)->update(['public_id' => (string) Str::ulid()]);
                }
            });

            Schema::table($tableName, function (Blueprint $table): void {
                $table->ulid('public_id')->nullable(false)->change();
                $table->unique('public_id');
            });
        }

        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->index(['tenant_id', 'created_at'], 'support_tickets_tenant_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->dropIndex('support_tickets_tenant_created_idx');
        });

        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                $table->dropUnique("{$tableName}_public_id_unique");
                $table->dropColumn('public_id');
            });
        }
    }
};
