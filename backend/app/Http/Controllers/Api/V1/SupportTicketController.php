<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Support\Actions\CreateTicketAction;
use App\Domain\Support\Actions\ReplyToTicketAction;
use App\Domain\Support\Models\SupportMessage;
use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreSupportMessageRequest;
use App\Http\Requests\Api\V1\StoreSupportTicketRequest;
use App\Http\Resources\Api\V1\SupportMessageResource;
use App\Http\Resources\Api\V1\SupportTicketResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->with(['user', 'latestMessage.user'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        return SupportTicketResource::collection($tickets);
    }

    public function store(StoreSupportTicketRequest $request, CreateTicketAction $action)
    {
        $ticket = $action->handle(
            $request->user(),
            $request->validated(),
            $request->file('attachment')
        );

        return new SupportTicketResource($ticket);
    }

    public function show(string $publicId, Request $request)
    {
        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
            ->where('user_id', $request->user()->id)
            ->with(['user', 'assignee'])
            ->firstOrFail();

        return new SupportTicketResource($ticket);
    }

    public function messages(string $publicId, Request $request)
    {
        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $messages = $ticket->messages()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->paginate((int) $request->input('per_page', 20));

        return SupportMessageResource::collection($messages);
    }

    public function reply(string $publicId, StoreSupportMessageRequest $request, ReplyToTicketAction $action)
    {
        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $message = $action->handle(
            $ticket,
            $request->user(),
            $request->validated()['body'],
            $request->file('attachment')
        );

        return new SupportMessageResource($message);
    }

    public function attachment(string $messagePublicId, Request $request)
    {
        if (! $request->hasValidSignature(false)) {
            abort(403, 'Invalid download signature.');
        }

        $message = SupportMessage::query()
            ->where('public_id', $messagePublicId)
            ->firstOrFail();

        $ticket = $message->ticket;
        $user = $request->user();

        $isPlatformUser = in_array($user->role?->value, ['platform_admin', 'platform_editor']);
        if (! $isPlatformUser && $ticket->user_id !== $user->id) {
            abort(403);
        }

        return Storage::disk(config('filesystems.default'))
            ->download($message->attachment_path, $message->attachment_name);
    }
}
