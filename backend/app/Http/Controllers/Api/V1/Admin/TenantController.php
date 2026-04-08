<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $query = Tenant::query()
            ->with('country')
            ->withCount('users');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('public_id', 'like', "%{$search}%");
            });
        }

        if ($plan = $request->input('plan')) {
            $query->where('plan', $plan);
        }

        $query->orderByDesc('created_at');

        $tenants = $query->cursorPaginate($request->input('limit', 30));

        return [
            'data' => $tenants->map(fn (Tenant $t) => [
                'public_id' => $t->public_id,
                'name' => $t->name,
                'plan' => $t->plan?->value,
                'trial_ends_at' => $t->trial_ends_at?->toIso8601String(),
                'users_count' => $t->users_count,
                'country' => $t->country?->name,
                'locale' => $t->locale,
                'created_at' => $t->created_at?->toIso8601String(),
            ]),
            'next_cursor' => $tenants->nextCursor()?->encode(),
        ];
    }
}
