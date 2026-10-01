<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\BuildDailyBriefingAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Support\WallClock;

class DailyBriefingController extends Controller
{
    public function today(Request $request, BuildDailyBriefingAction $builder): JsonResponse
    {
        $user = $request->user();

        $briefing = $builder->handle($user, Carbon::now());

        $first = $briefing['first_hearing'];
        if ($first !== null && isset($first['at'])) {
            // Wall-clock time without a timezone suffix (see App\Support\WallClock).
            $first['at'] = WallClock::toJson(
                $first['at'] instanceof Carbon ? $first['at'] : Carbon::parse($first['at'])
            );
            $briefing['first_hearing'] = $first;
        }

        return response()->json([
            'data' => $briefing,
        ]);
    }
}
