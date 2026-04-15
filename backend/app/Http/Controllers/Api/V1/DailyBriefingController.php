<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\BuildDailyBriefingAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DailyBriefingController extends Controller
{
    public function today(Request $request, BuildDailyBriefingAction $builder): JsonResponse
    {
        $user = $request->user();

        $briefing = $builder->handle($user, Carbon::now());

        $first = $briefing['first_hearing'];
        if ($first !== null && isset($first['at'])) {
            $first['at'] = $first['at'] instanceof Carbon
                ? $first['at']->toIso8601String()
                : Carbon::parse($first['at'])->toIso8601String();
            $briefing['first_hearing'] = $first;
        }

        return response()->json([
            'data' => $briefing,
        ]);
    }
}
