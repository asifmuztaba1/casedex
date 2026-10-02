<?php

namespace App\Domain\Tenancy\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceExport extends Model
{
    use BelongsToTenant, HasPublicId;

    public const STATUS_PENDING = 'pending';
    public const STATUS_READY = 'ready';
    public const STATUS_FAILED = 'failed';
    public const STATUS_EXPIRED = 'expired';

    public const REASON_MANUAL = 'manual';
    public const REASON_ACCOUNT_DELETION = 'account_deletion';

    protected $fillable = [
        'public_id',
        'tenant_id',
        'requested_by',
        'status',
        'reason',
        'path',
        'size_bytes',
        'completed_at',
        'expires_at',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function isDownloadable(): bool
    {
        return $this->status === self::STATUS_READY
            && $this->path !== null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }
}
