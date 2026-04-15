<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->timestamp('due_at')->nullable()->after('uploaded_by');
            $table->index(['tenant_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'due_at']);
            $table->dropColumn('due_at');
        });
    }
};
