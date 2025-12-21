<?php

namespace App\Domain\Notifications\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class CaseNotification extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'case_notifications';

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'title',
        'body',
        'status',
        'scheduled_for',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $notification): void {
            if ($notification->public_id === null) {
                $notification->public_id = (string) Str::ulid();
            }
        });
    }
}
