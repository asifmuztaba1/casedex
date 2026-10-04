<?php

namespace App\Domain\Voice\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One conversation with the voice associate, billed by its real length. */
class VoiceSession extends Model
{
    use BelongsToTenant, HasPublicId;

    public const STARTED = 'started';
    public const ENDED = 'ended';
    public const BILLED = 'billed';
    public const FAILED = 'failed';

    protected $fillable = [
        'public_id', 'tenant_id', 'user_id', 'conversation_id', 'status',
        'started_at', 'ended_at', 'duration_seconds', 'credits_charged',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_seconds' => 'integer',
        'credits_charged' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
