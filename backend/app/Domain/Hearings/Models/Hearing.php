<?php

namespace App\Domain\Hearings\Models;

use App\Domain\Hearings\Enums\HearingType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Hearing extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'hearing_type',
        'scheduled_at',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'hearing_type' => HearingType::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (self $hearing): void {
            if ($hearing->public_id === null) {
                $hearing->public_id = (string) Str::ulid();
            }
        });
    }
}
