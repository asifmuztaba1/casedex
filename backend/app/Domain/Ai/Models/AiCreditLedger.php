<?php

namespace App\Domain\Ai\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiCreditLedger extends Model
{
    use HasFactory, BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'user_id',
        'event_type',
        'feature',
        'credits_delta',
        'free_delta',
        'paid_delta',
        'free_balance_after',
        'paid_balance_after',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $ledger): void {
            if ($ledger->public_id === null) {
                $ledger->public_id = (string) Str::ulid();
            }

            if ($ledger->created_at === null) {
                $ledger->created_at = now();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
