<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ManualPaymentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'user_id',
        'plan',
        'interval',
        'amount',
        'currency',
        'sender_number',
        'transaction_id',
        'sent_at',
        'screenshot_disk',
        'screenshot_path',
        'status',
        'temporary_access_expires_at',
        'approved_starts_at',
        'approved_ends_at',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'plan' => TenantPlan::class,
        'status' => ManualPaymentRequestStatus::class,
        'amount' => 'decimal:2',
        'sent_at' => 'datetime',
        'temporary_access_expires_at' => 'datetime',
        'approved_starts_at' => 'datetime',
        'approved_ends_at' => 'datetime',
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
