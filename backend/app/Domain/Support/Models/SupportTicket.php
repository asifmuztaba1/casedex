<?php

namespace App\Domain\Support\Models;

use App\Domain\Support\Enums\TicketStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'public_id',
        'user_id',
        'tenant_id',
        'subject',
        'status',
        'assigned_to',
        'closed_at',
    ];

    protected $casts = [
        'status' => TicketStatus::class,
        'closed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $ticket): void {
            if ($ticket->public_id === null) {
                $ticket->public_id = (string) Str::ulid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(SupportMessage::class, 'ticket_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(SupportMessage::class, 'ticket_id')->latestOfMany();
    }
}
