<?php

namespace App\Domain\Support\Actions;

use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportMessage;
use App\Domain\Support\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CreateTicketAction
{
    public function handle(User $user, array $data, ?UploadedFile $attachment = null): SupportTicket
    {
        return DB::transaction(function () use ($user, $data, $attachment) {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'subject' => $data['subject'],
                'status' => TicketStatus::Open,
            ]);

            $messageData = [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'body' => $data['body'],
            ];

            if ($attachment) {
                $path = $attachment->store('support-attachments', config('filesystems.default'));
                $messageData['attachment_path'] = $path;
                $messageData['attachment_name'] = $attachment->getClientOriginalName();
                $messageData['attachment_mime'] = $attachment->getClientMimeType();
                $messageData['attachment_size'] = $attachment->getSize();
            }

            SupportMessage::create($messageData);

            $ticket->load(['messages.user', 'user']);

            return $ticket;
        });
    }
}
