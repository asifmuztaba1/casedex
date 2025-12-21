<?php

use App\Domain\Documents\Enums\DocumentType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('case_id')->nullable()->constrained('cases');
            $table->ulid('public_id')->unique();
            $table->enum('document_type', array_column(DocumentType::cases(), 'value'))->default(DocumentType::Other->value);
            $table->string('title');
            $table->string('file_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
