<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Auth\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('tenant', 'country');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('public_id', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $query->orderByDesc('created_at');

        $users = $query->cursorPaginate($request->input('limit', 30));

        return [
            'data' => $users->map(fn (User $u) => [
                'public_id' => $u->public_id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role?->value,
                'tenant_name' => $u->tenant?->name,
                'tenant_public_id' => $u->tenant?->public_id,
                'country' => $u->country?->name,
                'whatsapp_opted_in' => (bool) $u->whatsapp_opted_in,
                'email_verified_at' => $u->email_verified_at?->toIso8601String(),
                'created_at' => $u->created_at?->toIso8601String(),
            ]),
            'next_cursor' => $users->nextCursor()?->encode(),
        ];
    }

    public function updateRole(Request $request, string $publicId)
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(UserRole::allValues())],
        ]);

        $user = User::where('public_id', $publicId)->firstOrFail();
        $user->role = $validated['role'];
        $user->save();

        return [
            'data' => [
                'public_id' => $user->public_id,
                'name' => $user->name,
                'role' => $user->role?->value,
            ],
        ];
    }
}
