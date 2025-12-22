<?php

use App\Domain\Documents\Enums\DocumentCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->foreignId('hearing_id')->nullable()->constrained('hearings')->after('case_id');
            $table->enum('category', array_column(DocumentCategory::cases(), 'value'))
                ->default(DocumentCategory::Other->value)
                ->after('public_id');
            $table->string('original_name')->after('category');
            $table->string('mime')->after('original_name');
            $table->unsignedBigInteger('size')->after('mime');
            $table->string('storage_key')->after('size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->after('storage_key');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropColumn(['document_type', 'title', 'file_path', 'metadata']);
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->enum('document_type', array_column(DocumentCategory::cases(), 'value'))
                ->default(DocumentCategory::Other->value);
            $table->string('title');
            $table->string('file_path')->nullable();
            $table->json('metadata')->nullable();
            $table->dropColumn([
                'hearing_id',
                'category',
                'original_name',
                'mime',
                'size',
                'storage_key',
                'uploaded_by',
            ]);
        });
    }
};
