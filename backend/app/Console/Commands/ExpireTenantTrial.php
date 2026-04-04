<?php

namespace App\Console\Commands;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;

class ExpireTenantTrial extends Command
{
    protected $signature = 'billing:expire-trial
        {target : User email, tenant public ID, or tenant ID}
        {--force : Allow running outside local/testing environments}';

    protected $description = 'Expire a tenant trial immediately for QA/testing.';

    public function handle(PlanFeatureService $planFeatureService): int
    {
        if (! app()->environment(['local', 'testing']) && ! $this->option('force')) {
            $this->error('This command is limited to local/testing environments. Re-run with --force only if you are sure.');

            return self::FAILURE;
        }

        $tenant = $this->resolveTenant((string) $this->argument('target'));

        if ($tenant === null) {
            $this->error('No tenant found for the given target.');

            return self::FAILURE;
        }

        $tenant->forceFill([
            'trial_ends_at' => now()->subMinute(),
        ])->save();
        $tenant->refresh();

        $billingSource = $planFeatureService->billingSource($tenant);
        $hasActiveSubscription = $planFeatureService->hasActiveSubscription($tenant);
        $hasPendingAccess = $planFeatureService->hasManualPendingAccess($tenant);
        $hasApprovedAccess = $planFeatureService->hasManualApprovedAccess($tenant);
        $hasAccess = $planFeatureService->hasAccess($tenant);

        $this->table(
            ['Field', 'Value'],
            [
                ['Tenant', $tenant->name],
                ['Tenant public ID', $tenant->public_id],
                ['Plan', (string) $tenant->plan?->value],
                ['Trial ends at', (string) $tenant->trial_ends_at?->toDateTimeString()],
                ['Billing source', $billingSource],
                ['Active subscription', $hasActiveSubscription ? 'yes' : 'no'],
                ['Pending review access', $hasPendingAccess ? 'yes' : 'no'],
                ['Approved payment access', $hasApprovedAccess ? 'yes' : 'no'],
            ]
        );

        if ($hasAccess) {
            $this->warn('Trial is expired, but this tenant still has access through another billing state.');
            $this->line('Protected app routes are expected to stay accessible until that billing access is removed or expires.');
        } else {
            $this->info('Trial is expired and no billing access remains.');
            $this->line('Protected app routes should now return 403 subscription_required, while Billing should remain accessible.');
        }

        return self::SUCCESS;
    }

    private function resolveTenant(string $target): ?Tenant
    {
        $user = User::query()
            ->where('email', $target)
            ->with('tenant')
            ->first();

        if ($user?->tenant !== null) {
            return $user->tenant;
        }

        if (ctype_digit($target)) {
            $tenant = Tenant::query()->find((int) $target);
            if ($tenant !== null) {
                return $tenant;
            }
        }

        return Tenant::query()->where('public_id', $target)->first();
    }
}
