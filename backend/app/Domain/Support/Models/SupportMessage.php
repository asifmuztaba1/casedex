<?php

namespace App\Domain\Support\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SupportMessage extends Model
{
    protected $fillable = [
        'public_id',
        'ticket_id',
        'user_id',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $message): void {
            if ($message->public_id === null) {
                $message->public_id = (string) Str::ulid();
            }
        });
    }

    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
