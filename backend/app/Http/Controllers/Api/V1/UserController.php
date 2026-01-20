<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\CreateUserAction;
use App\Domain\Auth\Actions\ListUsersAction;
use App\Domain\Auth\Actions\UpdateUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreUserRequest;
use App\Http\Requests\Api\V1\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request, ListUsersAction $listUsers)
    {
        $this->authorize('viewAny', User::class);

        $users = $listUsers->handle($request->user());

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request, CreateUserAction $createUser)
    {
        $this->authorize('create', User::class);

        $user = $createUser->handle($request->user(), $request->validated());

        return new UserResource($user);
    }

    public function update(
        string $publicId,
        UpdateUserRequest $request,
        UpdateUserAction $updateUser
    ) {
        $actor = $request->user();

        $user = User::query()
            ->where('tenant_id', $actor->tenant_id)
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('update', $user);

        $user = $updateUser->handle($user, $request->validated(), $actor);

        return new UserResource($user);
    }
}
