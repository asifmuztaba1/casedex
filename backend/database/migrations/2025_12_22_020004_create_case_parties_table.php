<?php

use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_parties', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('case_id')->constrained('cases');
            $table->foreignId('client_id')->nullable()->constrained('clients');
            $table->enum('type', array_column(PartyType::cases(), 'value'));
            $table->string('name');
            $table->enum('side', array_column(PartySide::cases(), 'value'));
            $table->enum('role', array_column(PartyRole::cases(), 'value'))->default(PartyRole::Other->value);
            $table->boolean('is_client')->default(false);
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('identity_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_parties');
    }
};
