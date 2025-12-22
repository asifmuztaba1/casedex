<?php

namespace App\Providers;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Clients\Models\Client;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Research\Models\ResearchNote;
use App\Policies\CasePolicy;
use App\Policies\CaseParticipantPolicy;
use App\Policies\ClientPolicy;
use App\Policies\DiaryEntryPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\HearingPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\ResearchNotePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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
        Gate::policy(CaseFile::class, CasePolicy::class);
        Gate::policy(CaseParticipant::class, CaseParticipantPolicy::class);
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(Hearing::class, HearingPolicy::class);
        Gate::policy(DiaryEntry::class, DiaryEntryPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(ResearchNote::class, ResearchNotePolicy::class);
        Gate::policy(CaseNotification::class, NotificationPolicy::class);
    }
}
