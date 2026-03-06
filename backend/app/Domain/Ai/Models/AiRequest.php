<?php

namespace App\Domain\Ai\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiRequest extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'user_id',
        'feature',
        'status',
        'idempotency_key',
        'credits_cost',
        'credits_refunded',
        'request_payload',
        'result_text',
        'result_payload',
        'error_message',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'result_payload' => 'array',
        'credits_refunded' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $request): void {
            if ($request->public_id === null) {
                $request->public_id = (string) Str::ulid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
