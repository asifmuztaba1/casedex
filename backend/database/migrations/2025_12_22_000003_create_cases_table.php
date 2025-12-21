<?php

use App\Domain\Cases\Enums\CaseStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->ulid('public_id')->unique();
            $table->string('title');
            $table->string('reference')->nullable();
            $table->text('summary')->nullable();
            $table->enum('status', array_column(CaseStatus::cases(), 'value'))->default(CaseStatus::Open->value);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
