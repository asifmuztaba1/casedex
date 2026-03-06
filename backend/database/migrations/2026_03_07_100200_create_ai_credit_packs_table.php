<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_credit_packs', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('code', 64)->unique();
            $table->string('name', 120);
            $table->unsignedInteger('credits');
            $table->unsignedInteger('price_usd_cents');
            $table->decimal('price_bdt', 10, 2);
            $table->string('lemon_variant_id', 64)->nullable()->unique();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['active', 'sort_order'], 'ai_packs_active_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_credit_packs');
    }
};
