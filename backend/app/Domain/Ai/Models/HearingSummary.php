<?php

namespace App\Domain\Ai\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class HearingSummary extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'hearing_id',
        'content',
        'sources',
        'is_ai_assisted',
    ];

    protected $casts = [
        'sources' => 'array',
        'is_ai_assisted' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $summary): void {
            if ($summary->public_id === null) {
                $summary->public_id = (string) Str::ulid();
            }
        });
    }
}
