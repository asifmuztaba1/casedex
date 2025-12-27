<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('courts', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->constrained('court_divisions')->cascadeOnDelete();
            $table->foreignId('district_id')->constrained('court_districts')->cascadeOnDelete();
            $table->foreignId('court_type_id')->constrained('court_types')->cascadeOnDelete();
            $table->string('name');
            $table->string('name_bn');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['district_id', 'court_type_id', 'name']);
            $table->index(['country_id', 'district_id', 'court_type_id']);
            $table->index(['country_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courts');
    }
};
