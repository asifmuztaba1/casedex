<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judiciary_causelist_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('court_id')->constrained('courts')->cascadeOnDelete();
            $table->date('cause_list_date');
            $table->enum('status', ['ok', 'empty', 'failed']);
            $table->unsignedInteger('row_count')->default(0);
            $table->unsignedInteger('match_count')->default(0);
            $table->unsignedInteger('notification_count')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('scraped_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'court_id', 'cause_list_date'], 'causelist_logs_unique');
            $table->index(['court_id', 'cause_list_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judiciary_causelist_logs');
    }
};
