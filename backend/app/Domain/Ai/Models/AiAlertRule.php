<?php

namespace App\Domain\Ai\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiAlertRule extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'threshold_credits',
        'channel_in_app',
        'channel_email',
        'is_active',
        'created_by',
        'updated_by',
        'last_triggered_at',
    ];

    protected $casts = [
        'channel_in_app' => 'boolean',
        'channel_email' => 'boolean',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $rule): void {
            if ($rule->public_id === null) {
                $rule->public_id = (string) Str::ulid();
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
