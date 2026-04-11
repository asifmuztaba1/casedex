<?php

namespace App\Domain\Support\Actions;

use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportMessage;
use App\Domain\Support\Models\SupportTicket;
use App\Models\User;
use App\Support\TenantContext;
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
                $this->notifyTicketOwner($ticket, $user);
            } elseif ($ticket->status === TicketStatus::AwaitingReply) {
                $ticket->update(['status' => TicketStatus::Open]);
            }

            $message->load('user');

            return $message;
        });
    }

    private function notifyTicketOwner(SupportTicket $ticket, User $replier): void
    {
        $ticketOwner = $ticket->user;

        if (! $ticketOwner || ! $ticketOwner->tenant_id) {
            return;
        }

        TenantContext::set($ticketOwner->tenant_id);

        try {
            CaseNotification::query()->withoutGlobalScope('tenant')->create([
                'tenant_id' => $ticketOwner->tenant_id,
                'user_id' => $ticketOwner->id,
                'notification_type' => 'support_reply',
                'channel' => 'in_app',
                'title' => 'New reply on your support ticket',
                'body' => "Your ticket \"{$ticket->subject}\" has a new reply.",
                'status' => 'pending',
                'scheduled_for' => now(),
            ]);
        } finally {
            TenantContext::clear();
        }
    }
}
