<?php

use App\Domain\Cases\Enums\CaseParticipantRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('case_id')->constrained('cases');
            $table->foreignId('user_id')->constrained('users');
            $table->enum('role', array_column(CaseParticipantRole::cases(), 'value'));
            $table->timestamps();
            $table->unique(['case_id', 'user_id']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_participants');
    }
};
