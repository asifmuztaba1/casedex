<?php

namespace Database\Seeders;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Clients\Models\Client;
use App\Domain\Documents\Enums\DocumentCategory;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(CountriesSeeder::class);
        $this->call(CourtTypesSeeder::class);

        $countryId = \App\Domain\Tenancy\Models\Country::query()
            ->where('code', 'BD')
            ->value('id');

        User::query()->firstOrCreate(
            ['email' => 'platform.admin@casedex.app'],
            [
                'name' => 'CaseDex Platform Admin',
                'password' => Hash::make('password'),
                'role' => UserRole::PlatformAdmin,
                'country_id' => $countryId,
            ]
        );

        $tenant = Tenant::create([
            'name' => 'Demo Law Firm',
            'plan' => TenantPlan::Free,
            'country_id' => $countryId,
        ]);

        TenantContext::set($tenant->id);

        $admin = User::factory()->create([
            'name' => 'Amina Rahman',
            'email' => 'admin@demo.casedex.app',
            'tenant_id' => $tenant->id,
            'role' => UserRole::Admin,
            'country_id' => $countryId,
        ]);

        $lawyer = User::factory()->create([
            'name' => 'Kareem Siddiq',
            'email' => 'lawyer@demo.casedex.app',
            'tenant_id' => $tenant->id,
            'role' => UserRole::Lawyer,
            'country_id' => $countryId,
        ]);

        $assistant = User::factory()->create([
            'name' => 'Nadia Khan',
            'email' => 'assistant@demo.casedex.app',
            'tenant_id' => $tenant->id,
            'role' => UserRole::Assistant,
            'country_id' => $countryId,
        ]);

        $client = Client::create([
            'name' => 'Rafiq Hasan',
            'phone' => '+880100000000',
            'email' => 'client@example.com',
            'address' => 'Dhanmondi, Dhaka',
            'identity_number' => 'A1234567',
            'notes' => 'Prefers morning updates.',
        ]);

        $case = CaseFile::create([
            'title' => 'Hasan v. City Authority',
            'court' => 'High Court Division',
            'case_number' => 'HC-2026-118',
            'status' => CaseStatus::Active,
            'client_id' => $client->id,
            'story' => 'Client reports repeated harassment related to property dispute.',
            'petition_draft' => 'Draft petition outlining relief requested and supporting facts.',
            'created_by' => $admin->id,
        ]);

        CaseParticipant::create([
            'case_id' => $case->id,
            'user_id' => $admin->id,
            'role' => CaseParticipantRole::LeadLawyer,
        ]);

        CaseParticipant::create([
            'case_id' => $case->id,
            'user_id' => $lawyer->id,
            'role' => CaseParticipantRole::Lawyer,
        ]);

        CaseParticipant::create([
            'case_id' => $case->id,
            'user_id' => $assistant->id,
            'role' => CaseParticipantRole::Assistant,
        ]);

        $hearing = Hearing::create([
            'case_id' => $case->id,
            'hearing_at' => now()->addDays(1)->setTime(9, 30),
            'type' => HearingType::Hearing,
            'agenda' => 'Preliminary arguments and filing review.',
            'location' => 'Courtroom 3',
            'minutes' => 'Awaiting hearing.',
            'next_steps' => 'Prepare response brief.',
        ]);

        DiaryEntry::create([
            'case_id' => $case->id,
            'hearing_id' => $hearing->id,
            'entry_at' => now()->subDay(),
            'title' => 'Filed updated petition draft',
            'body' => 'Updated petition draft shared with the team for review.',
            'created_by' => $lawyer->id,
        ]);

        Document::create([
            'case_id' => $case->id,
            'hearing_id' => $hearing->id,
            'category' => DocumentCategory::Petition,
            'original_name' => 'petition-draft.pdf',
            'mime' => 'application/pdf',
            'size' => 204800,
            'storage_key' => 'seed/petition-draft.pdf',
            'uploaded_by' => $assistant->id,
        ]);

        CaseNotification::create([
            'case_id' => $case->id,
            'user_id' => $assistant->id,
            'hearing_id' => $hearing->id,
            'notification_type' => 'hearing_reminder',
            'channel' => 'in_app',
            'title' => 'Hearing reminder',
            'body' => 'Reminder: hearing scheduled for tomorrow.',
            'status' => 'pending',
            'scheduled_for' => now()->addDay()->startOfDay(),
        ]);

        TenantContext::clear();
    }
}
