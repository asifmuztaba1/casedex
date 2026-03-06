<?php

namespace App\Domain\Ai\Models;

use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiCreditWallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'free_balance',
        'paid_balance',
        'monthly_free_credits',
        'cycle_starts_at',
        'cycle_ends_at',
        'next_free_grant_at',
    ];

    protected $casts = [
        'cycle_starts_at' => 'datetime',
        'cycle_ends_at' => 'datetime',
        'next_free_grant_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
