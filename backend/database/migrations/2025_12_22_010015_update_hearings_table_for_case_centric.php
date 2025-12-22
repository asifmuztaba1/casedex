<?php

use App\Domain\Hearings\Enums\HearingType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hearings', function (Blueprint $table): void {
            $table->timestamp('hearing_at')->nullable()->after('public_id');
            $table->enum('type', array_column(HearingType::cases(), 'value'))
                ->default(HearingType::Hearing->value)
                ->after('hearing_at');
            $table->text('agenda')->nullable()->after('type');
            $table->string('location')->nullable()->after('agenda');
            $table->text('outcome')->nullable()->after('location');
            $table->longText('minutes')->nullable()->after('outcome');
            $table->longText('next_steps')->nullable()->after('minutes');
        });

        Schema::table('hearings', function (Blueprint $table): void {
            $table->dropColumn(['hearing_type', 'scheduled_at', 'notes']);
        });
    }

    public function down(): void
    {
        Schema::table('hearings', function (Blueprint $table): void {
            $table->enum('hearing_type', array_column(HearingType::cases(), 'value'))
                ->default(HearingType::Hearing->value);
            $table->timestamp('scheduled_at')->nullable();
            $table->text('notes')->nullable();
            $table->dropColumn([
                'hearing_at',
                'type',
                'agenda',
                'location',
                'outcome',
                'minutes',
                'next_steps',
            ]);
        });
    }
};
