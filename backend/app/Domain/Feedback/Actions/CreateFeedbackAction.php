<?php

namespace App\Domain\Feedback\Actions;

use App\Domain\Feedback\Models\Feedback;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class CreateFeedbackAction
{
    public function handle(User $user, array $data): Feedback
    {
        try {
            $feedback = Feedback::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
                'trigger' => $data['trigger'],
            ]);

            $feedback->load('user');

            return $feedback;
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry') || $e->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'trigger' => ['Feedback has already been submitted for this trigger.'],
                ]);
            }

            throw $e;
        }
    }
}
