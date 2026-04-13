<?php

namespace App\Domain\Feedback\Models;

use App\Domain\Feedback\Enums\FeedbackTrigger;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Feedback extends Model
{
    protected $table = 'feedback';

    protected $fillable = [
        'public_id',
        'tenant_id',
        'user_id',
        'rating',
        'comment',
        'trigger',
    ];

    protected $casts = [
        'rating' => 'integer',
        'trigger' => FeedbackTrigger::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (self $feedback): void {
            if ($feedback->public_id === null) {
                $feedback->public_id = (string) Str::ulid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Tenancy\Models\Tenant::class);
    }
}
