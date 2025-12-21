<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('case_id')->nullable()->constrained('cases');
            $table->ulid('public_id')->unique();
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('scheduled_for')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_notifications');
    }
};
