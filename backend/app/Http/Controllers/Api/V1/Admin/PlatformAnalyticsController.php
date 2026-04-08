<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformAnalyticsController extends Controller
{
    public function index(Request $request): array
    {
        $totalTenants = Tenant::count();
        $totalUsers = User::count();
        $totalCases = CaseFile::withoutGlobalScopes()->count();

        $tenantsByPlan = Tenant::query()
            ->select('plan', DB::raw('count(*) as count'))
            ->groupBy('plan')
            ->pluck('count', 'plan')
            ->toArray();

        $onTrial = Tenant::query()
            ->where('plan', 'trial')
            ->where('trial_ends_at', '>', now())
            ->count();

        $trialExpired = Tenant::query()
            ->where('plan', 'trial')
            ->where(function ($q) {
                $q->whereNull('trial_ends_at')
                  ->orWhere('trial_ends_at', '<=', now());
            })
            ->count();

        $pendingPayments = ManualPaymentRequest::where('status', 'pending')->count();

        $recentTenants = Tenant::query()
            ->with('country')
            ->withCount('users')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Tenant $t) => [
                'public_id' => $t->public_id,
                'name' => $t->name,
                'plan' => $t->plan?->value,
                'users_count' => $t->users_count,
                'country' => $t->country?->name,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        $recentUsers = User::query()
            ->with('tenant', 'country')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (User $u) => [
                'public_id' => $u->public_id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role?->value,
                'tenant_name' => $u->tenant?->name,
                'country' => $u->country?->name,
                'created_at' => $u->created_at?->toIso8601String(),
            ]);

        return [
            'total_tenants' => $totalTenants,
            'total_users' => $totalUsers,
            'total_cases' => $totalCases,
            'tenants_by_plan' => $tenantsByPlan,
            'on_trial' => $onTrial,
            'trial_expired' => $trialExpired,
            'pending_payments' => $pendingPayments,
            'recent_tenants' => $recentTenants,
            'recent_users' => $recentUsers,
        ];
    }
}
