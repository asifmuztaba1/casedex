<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manual_payment_requests', function (Blueprint $table): void {
            // bkash | rocket. Nullable: requests submitted before this column existed have no channel.
            $table->string('channel', 16)->nullable()->after('sender_number');
        });
    }

    public function down(): void
    {
        Schema::table('manual_payment_requests', function (Blueprint $table): void {
            $table->dropColumn('channel');
        });
    }
};
