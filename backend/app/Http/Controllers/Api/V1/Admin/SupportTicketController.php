<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Support\Actions\ReplyToTicketAction;
use App\Domain\Support\Actions\UpdateTicketStatusAction;
use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreSupportMessageRequest;
use App\Http\Resources\Api\V1\SupportMessageResource;
use App\Http\Resources\Api\V1\SupportTicketResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(array_column(TicketStatus::cases(), 'value'))],
            'search' => ['sometimes', 'string', 'max:255'],
        ]);

        $query = SupportTicket::query()
            ->with(['user', 'assignee', 'latestMessage.user'])
            ->latest('id');

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['search'])) {
            $search = trim($data['search']);
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $tickets = $query->paginate((int) $request->input('per_page', 15));

        return SupportTicketResource::collection($tickets);
    }

    public function show(string $publicId)
    {
        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
            ->with(['user', 'assignee'])
            ->firstOrFail();

        return new SupportTicketResource($ticket);
    }

    public function messages(string $publicId, Request $request)
    {
        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
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
            ->firstOrFail();

        $message = $action->handle(
            $ticket,
            $request->user(),
            $request->validated()['body'],
            $request->file('attachment')
        );

        return new SupportMessageResource($message);
    }

    public function updateStatus(string $publicId, Request $request, UpdateTicketStatusAction $action)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_column(TicketStatus::cases(), 'value'))],
        ]);

        $ticket = SupportTicket::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $ticket = $action->handle($ticket, TicketStatus::from($data['status']));

        return new SupportTicketResource($ticket);
    }
}
