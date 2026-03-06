<?php

namespace App\Domain\Tenancy\Models;

use App\Domain\Ai\Models\AiCreditWallet;
use App\Domain\Billing\Models\ManualPaymentRequest;
use Database\Factories\TenantFactory;
use LemonSqueezy\Laravel\Billable;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Domain\Tenancy\Enums\TenantPlan;

class Tenant extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Billable;

    protected $fillable = [
        'name',
        'public_id',
        'plan',
        'trial_ends_at',
        'country_id',
        'locale',
    ];

    protected $casts = [
        'plan' => TenantPlan::class,
        'trial_ends_at' => 'datetime',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function manualPaymentRequests(): HasMany
    {
        return $this->hasMany(ManualPaymentRequest::class);
    }

    public function aiCreditWallet()
    {
        return $this->hasOne(AiCreditWallet::class);
    }

    public function lemonSqueezyEmail(): ?string
    {
        return $this->users()
            ->orderByRaw("role = 'admin' desc")
            ->orderBy('id')
            ->value('email');
    }

    public function lemonSqueezyCountry(): ?string
    {
        return $this->country?->code;
    }

    protected static function booted(): void
    {
        static::creating(function (self $tenant): void {
            if ($tenant->public_id === null) {
                $tenant->public_id = (string) Str::ulid();
            }
        });
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }
}
