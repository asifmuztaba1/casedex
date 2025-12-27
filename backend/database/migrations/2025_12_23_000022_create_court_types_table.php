<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('court_types', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_bn');
            $table->timestamps();

            $table->unique(['country_id', 'name']);
            $table->unique(['country_id', 'name_bn']);
            $table->index(['country_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('court_types');
    }
};
