<?php

namespace App\Domain\Ai\Models;

use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiManualPaymentRequest extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'user_id',
        'ai_credit_pack_id',
        'amount',
        'currency',
        'sender_number',
        'transaction_id',
        'sent_at',
        'screenshot_disk',
        'screenshot_path',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'status' => ManualPaymentRequestStatus::class,
        'amount' => 'decimal:2',
        'sent_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $request): void {
            if ($request->public_id === null) {
                $request->public_id = (string) Str::ulid();
            }
        });
    }

    public function pack()
    {
        return $this->belongsTo(AiCreditPack::class, 'ai_credit_pack_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
