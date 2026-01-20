<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\SendPasswordChangedMailAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, SendPasswordChangedMailAction $passwordChanged)
    {
        $user = $request->user();
        $data = $request->validated();
        $passwordUpdated = false;

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
            $passwordUpdated = true;
        }

        $user->save();

        if ($passwordUpdated) {
            $passwordChanged->handle($user, (string) $request->ip());
        }

        return new UserResource($user);
    }
}
