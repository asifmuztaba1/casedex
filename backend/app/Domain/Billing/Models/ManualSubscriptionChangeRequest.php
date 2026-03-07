<?php

namespace App\Domain\Billing\Models;

use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Enums\ManualSubscriptionChangeType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ManualSubscriptionChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'requested_by',
        'type',
        'current_plan',
        'current_interval',
        'requested_plan',
        'requested_interval',
        'effective_at',
        'status',
        'reviewed_by',
        'reviewed_at',
        'applied_at',
        'rejection_reason',
    ];

    protected $casts = [
        'type' => ManualSubscriptionChangeType::class,
        'status' => ManualSubscriptionChangeStatus::class,
        'current_plan' => TenantPlan::class,
        'requested_plan' => TenantPlan::class,
        'effective_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'applied_at' => 'datetime',
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

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
