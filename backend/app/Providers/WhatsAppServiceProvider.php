<?php

namespace App\Providers;

use App\Domain\Notifications\Contracts\WhatsAppTransport;
use App\Domain\Notifications\Services\MetaCloudWhatsAppTransport;
use App\Domain\Notifications\Services\NullWhatsAppTransport;
use Illuminate\Support\ServiceProvider;

class WhatsAppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WhatsAppTransport::class, function () {
            $driver = config('services.whatsapp.driver', 'null');

            if ($driver === 'meta') {
                return new MetaCloudWhatsAppTransport(
                    accessToken: config('services.whatsapp.access_token', ''),
                    phoneNumberId: config('services.whatsapp.phone_number_id', ''),
                );
            }

            return new NullWhatsAppTransport();
        });
    }
}
