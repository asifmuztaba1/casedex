<?php

namespace App\Domain\Ai\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiCreditPack extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'code',
        'name',
        'credits',
        'price_usd_cents',
        'price_bdt',
        'lemon_variant_id',
        'active',
        'sort_order',
    ];

    protected $casts = [
        'active' => 'boolean',
        'price_bdt' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $pack): void {
            if ($pack->public_id === null) {
                $pack->public_id = (string) Str::ulid();
            }
        });
    }
}
