<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Exceptions\InvalidCustomer;

class GetCustomerPortalUrlAction
{
    public function handle(Tenant $tenant): string
    {
        try {
            return $tenant->customerPortalUrl();
        } catch (InvalidCustomer) {
            abort(422, __('messages.billing_customer_missing'));
        }
    }
}
