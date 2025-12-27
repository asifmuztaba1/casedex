<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->country_id = $data['country_id'];
        if (! empty($data['locale'])) {
            $user->locale = $data['locale'];
            if ($user->role?->value === 'admin' && $user->tenant) {
                $user->tenant->locale = $data['locale'];
                $user->tenant->save();
            }
        }

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return new UserResource($user);
    }
}
