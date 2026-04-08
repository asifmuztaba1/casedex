<?php

namespace App\Domain\Support\Actions;

use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportMessage;
use App\Domain\Support\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ReplyToTicketAction
{
    public function handle(SupportTicket $ticket, User $user, string $body, ?UploadedFile $attachment = null): SupportMessage
    {
        return DB::transaction(function () use ($ticket, $user, $body, $attachment) {
            $messageData = [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'body' => $body,
            ];

            if ($attachment) {
                $path = $attachment->store('support-attachments', config('filesystems.default'));
                $messageData['attachment_path'] = $path;
                $messageData['attachment_name'] = $attachment->getClientOriginalName();
                $messageData['attachment_mime'] = $attachment->getClientMimeType();
                $messageData['attachment_size'] = $attachment->getSize();
            }

            $message = SupportMessage::create($messageData);

            $isPlatformUser = in_array($user->role?->value, ['platform_admin', 'platform_editor']);

            if ($isPlatformUser) {
                $ticket->update(['status' => TicketStatus::AwaitingReply]);
            } elseif ($ticket->status === TicketStatus::AwaitingReply) {
                $ticket->update(['status' => TicketStatus::Open]);
            }

            $message->load('user');

            return $message;
        });
    }
}
