<?php

namespace App\Domain\Notifications\Models;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
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
        'user_id',
        'hearing_id',
        'notification_type',
        'channel',
        'title',
        'body',
        'status',
        'scheduled_for',
        'sent_at',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'sent_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $notification): void {
            if ($notification->public_id === null) {
                $notification->public_id = (string) Str::ulid();
            }
        });
    }

    public function case()
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function hearing()
    {
        return $this->belongsTo(Hearing::class, 'hearing_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
