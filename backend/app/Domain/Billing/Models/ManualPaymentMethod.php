<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\ManualPaymentChannel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ManualPaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'channel',
        'account_name',
        'receiver_number',
        'instructions_en',
        'instructions_bn',
        'active',
        'sort_order',
    ];

    protected $casts = [
        'channel' => ManualPaymentChannel::class,
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $method): void {
            if ($method->public_id === null) {
                $method->public_id = (string) Str::ulid();
            }
        });
    }
}
