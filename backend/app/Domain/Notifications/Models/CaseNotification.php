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
use App\Domain\Notifications\Push\PushSender;
use App\Jobs\SendWebPushJob;

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

        // Opt-in web push: in-app notifications also go to the recipient's
        // subscribed browsers. Email/WhatsApp rows are separate deliveries.
        static::created(function (self $notification): void {
            if ($notification->channel !== 'in_app' || $notification->user_id === null) {
                return;
            }
            if (! app(PushSender::class)->isConfigured()) {
                return;
            }

            SendWebPushJob::dispatch($notification->tenant_id, $notification->id)->afterCommit();
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
