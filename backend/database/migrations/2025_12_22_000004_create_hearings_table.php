<?php

use App\Domain\Hearings\Enums\HearingType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hearings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('case_id')->nullable()->constrained('cases');
            $table->ulid('public_id')->unique();
            $table->enum('hearing_type', array_column(HearingType::cases(), 'value'))->default(HearingType::Hearing->value);
            $table->timestamp('scheduled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hearings');
    }
};
