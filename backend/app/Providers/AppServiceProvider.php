<?php

namespace App\Providers;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Billing\Listeners\SubscriptionCancelledListener;
use App\Domain\Billing\Listeners\SubscriptionCreatedListener;
use App\Domain\Billing\Listeners\SubscriptionExpiredListener;
use App\Domain\Billing\Listeners\SubscriptionPaymentFailedListener;
use App\Domain\Billing\Listeners\SubscriptionUpdatedListener;
use App\Domain\Ai\Listeners\LemonOrderCreatedListener;
use App\Domain\Clients\Models\Client;
use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Research\Models\ResearchNote;
use App\Models\User;
use App\Policies\CasePolicy;
use App\Policies\CaseParticipantPolicy;
use App\Policies\CasePartyPolicy;
use App\Policies\ClientPolicy;
use App\Policies\CourtAdminPolicy;
use App\Policies\DiaryEntryPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\HearingPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\ResearchNotePolicy;
use App\Policies\PushSubscriptionPolicy;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;
use LemonSqueezy\Laravel\Events\SubscriptionCancelled;
use LemonSqueezy\Laravel\Events\SubscriptionCreated;
use LemonSqueezy\Laravel\Events\SubscriptionExpired;
use LemonSqueezy\Laravel\Events\OrderCreated;
use LemonSqueezy\Laravel\Events\SubscriptionPaymentFailed;
use LemonSqueezy\Laravel\Events\SubscriptionUpdated;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        Gate::policy(CaseFile::class, CasePolicy::class);
        Gate::policy(CaseParticipant::class, CaseParticipantPolicy::class);
        Gate::policy(CaseParty::class, CasePartyPolicy::class);
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(Hearing::class, HearingPolicy::class);
        Gate::policy(DiaryEntry::class, DiaryEntryPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(ResearchNote::class, ResearchNotePolicy::class);
        Gate::policy(CaseNotification::class, NotificationPolicy::class);
        Gate::policy(PushSubscription::class, PushSubscriptionPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(CourtDivision::class, CourtAdminPolicy::class);
        Gate::policy(CourtDistrict::class, CourtAdminPolicy::class);
        Gate::policy(CourtType::class, CourtAdminPolicy::class);
        Gate::policy(Court::class, CourtAdminPolicy::class);

        Event::listen(SubscriptionCreated::class, SubscriptionCreatedListener::class);
        Event::listen(SubscriptionUpdated::class, SubscriptionUpdatedListener::class);
        Event::listen(SubscriptionCancelled::class, SubscriptionCancelledListener::class);
        Event::listen(SubscriptionExpired::class, SubscriptionExpiredListener::class);
        Event::listen(SubscriptionPaymentFailed::class, SubscriptionPaymentFailedListener::class);
        Event::listen(OrderCreated::class, LemonOrderCreatedListener::class);
    }
}
