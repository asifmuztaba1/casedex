<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Platform\Services\RegistrationPolicy;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RegistrationController extends Controller
{
    /** Whether sign-up needs an invite code (private beta), so the form can ask for one. */
    public function show(RegistrationPolicy $registration): JsonResponse
    {
        return response()->json(['data' => ['mode' => $registration->mode()]]);
    }
}
