<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manual_payment_methods', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('channel', 32);
            $table->string('account_name')->nullable();
            $table->string('receiver_number', 32);
            $table->text('instructions_en')->nullable();
            $table->text('instructions_bn')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['active', 'sort_order']);
            $table->unique(['channel', 'receiver_number'], 'manual_methods_channel_receiver_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manual_payment_methods');
    }
};
