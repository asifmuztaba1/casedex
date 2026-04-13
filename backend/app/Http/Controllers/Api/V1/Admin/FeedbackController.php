<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Feedback\Models\Feedback;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\FeedbackResource;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::query()
            ->with('user')
            ->latest('id');

        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->input('rating'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $feedback = $query->paginate((int) $request->input('per_page', 15));

        return FeedbackResource::collection($feedback);
    }
}
