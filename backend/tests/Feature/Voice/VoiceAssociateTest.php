<?php

use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Voice\Models\VoiceSession;
use App\Domain\Voice\Services\VoiceSettings;
use App\Jobs\FinalizeVoiceSessionJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

const ASSOCIATE_KEY = 'sk_live_elevenlabs_ASSOC_5678';

beforeEach(function (): void {
    Config::set('billing.ai.monthly_free_credits', 100);
    Config::set('billing.ai.voice.associate_credits_per_minute', 2);

    $GLOBALS['assoc_tool_counter'] = 0;
    $GLOBALS['assoc_replies'] = [
        'conversation/token' => Http::response(['token' => 'webrtc-token-abc', 'conversation_id' => 'conv_123']),
        'conversations/conv_123' => Http::response(['status' => 'done', 'metadata' => ['call_duration_secs' => 130]]),
        'agents/create' => Http::response(['agent_id' => 'agent_new']),
        'agents/agent_new' => Http::response(['agent_id' => 'agent_new']),
    ];
    Http::fake(function (Request $request) {
        if (str_ends_with($request->url(), '/v1/convai/tools') && $request->method() === 'POST') {
            return Http::response(['id' => 'tool_'.(++$GLOBALS['assoc_tool_counter'])]);
        }
        if (str_contains($request->url(), '/v1/convai/tools/') && $request->method() === 'DELETE') {
            return Http::response([], 204);
        }
        foreach ($GLOBALS['assoc_replies'] as $path => $reply) {
            if (str_contains($request->url(), '/v1/convai/'.$path)) {
                return $reply;
            }
        }

        return Http::response(['detail' => 'unexpected'], 500);
    });
});

function associateAdmin(): User
{
    return User::factory()->create(['tenant_id' => null, 'role' => UserRole::PlatformAdmin]);
}

/** Voice on, the agent set up, and a firm in the beta with a consenting lawyer. */
function associateLawyer(bool $firmInBeta = true, bool $consented = true): User
{
    app(VoiceSettings::class)->update(true, false, ASSOCIATE_KEY, associateAdmin()->id);
    app(VoiceSettings::class)->saveAssociate('agent_new', ['tool_1'], associateAdmin()->id);

    [$tenant, $user] = createAiQaTenantUser(role: UserRole::Lawyer, withActiveSubscription: true, plan: TenantPlan::Professional);
    $tenant->forceFill(['voice_associate_enabled' => $firmInBeta, 'name' => 'Rahim Chambers'])->save();
    $user->forceFill(['voice_consent_at' => $consented ? now() : null, 'name' => 'Rahim Uddin', 'locale' => 'bn'])->save();

    return $user;
}

function startCall(User $user): Illuminate\Testing\TestResponse
{
    app('auth')->forgetGuards();

    return test()->actingAs($user)->postJson('/api/v1/voice/associate/sessions');
}

function walletTotal(User $user): int
{
    $wallet = app(AiCreditService::class)->getOrCreateWallet($user->tenant)->fresh();

    return $wallet->free_balance + $wallet->paid_balance;
}

describe('setting up the associate', function (): void {
    it('creates the agent with its tools and the shared guardrails', function (): void {
        app(VoiceSettings::class)->update(true, false, ASSOCIATE_KEY, associateAdmin()->id);

        $this->actingAs(associateAdmin())->postJson('/api/v1/admin/voice/associate/sync')
            ->assertOk()->assertJsonPath('data.associate_configured', true);

        expect(app(VoiceSettings::class)->associateAgentId())->toBe('agent_new');
        expect(app(VoiceSettings::class)->associateToolIds())->toHaveCount(6);

        Http::assertSent(function (Request $request): bool {
            if (! str_ends_with($request->url(), '/v1/convai/agents/create')) {
                return false;
            }
            $prompt = $request['conversation_config']['agent']['prompt']['prompt'];

            return str_contains($prompt, 'Never predict the outcome of a case')
                && str_contains($prompt, 'never say something was saved')
                && $request['conversation_config']['agent']['prompt']['tool_ids'] === ['tool_1', 'tool_2', 'tool_3', 'tool_4', 'tool_5', 'tool_6']
                && $request['conversation_config']['conversation']['max_duration_seconds'] === 600
                && $request['platform_settings']['auth']['enable_auth'] === true
                && $request->header('xi-api-key') === [ASSOCIATE_KEY];
        });
        Http::assertSent(fn (Request $request): bool => str_ends_with($request->url(), '/v1/convai/tools')
            && $request['tool_config']['name'] === 'draft_diary_entry'
            && $request['tool_config']['type'] === 'client'
            && str_contains($request['tool_config']['description'], 'Does not save'));
    });

    it('updates the same agent next time and removes the old tools', function (): void {
        app(VoiceSettings::class)->update(true, false, ASSOCIATE_KEY, associateAdmin()->id);
        $this->actingAs(associateAdmin())->postJson('/api/v1/admin/voice/associate/sync')->assertOk();
        $this->postJson('/api/v1/admin/voice/associate/sync')->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->method() === 'PATCH' && str_ends_with($request->url(), '/v1/convai/agents/agent_new'));
        Http::assertSent(fn (Request $request): bool => $request->method() === 'DELETE' && str_ends_with($request->url(), '/v1/convai/tools/tool_1'));
    });

    it('lets platform admins put firms in the beta', function (): void {
        [$tenant] = createAiQaTenantUser();
        $this->actingAs(associateAdmin());

        $this->putJson("/api/v1/admin/voice/associate-tenants/{$tenant->public_id}", ['enabled' => true])
            ->assertOk()->assertJsonPath('data.associate_enabled', true);
        expect($tenant->fresh()->voice_associate_enabled)->toBeTrue();
        expect(collect($this->getJson('/api/v1/admin/voice/associate-tenants')->json('data'))->firstWhere('public_id', $tenant->public_id)['associate_enabled'])->toBeTrue();
    });
});

describe('talking to the associate', function (): void {
    it('starts a call with a one-time token and the lawyer\'s details', function (): void {
        $user = associateLawyer();
        $this->actingAs($user)->getJson('/api/v1/voice/status')
            ->assertJsonPath('data.associate_available', true)
            ->assertJsonPath('data.associate_credits_per_minute', 2);

        $data = startCall($user)->assertCreated()->json('data');

        expect($data['conversation_token'])->toBe('webrtc-token-abc');
        expect($data['max_seconds'])->toBe(600);
        expect($data['dynamic_variables'])->toMatchArray(['user_name' => 'Rahim Uddin', 'firm_name' => 'Rahim Chambers']);
        expect($data['dynamic_variables']['greeting'])->toContain('Rahim');
        expect(VoiceSession::query()->withoutGlobalScopes()->sole()->conversation_id)->toBe('conv_123');
        expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'voice.associate_started')->count())->toBe(1);
        Http::assertSent(fn (Request $request): bool => str_contains($request->url(), '/v1/convai/conversation/token?agent_id=agent_new'));
    });

    it('is only for firms in the beta', function (): void {
        $user = associateLawyer(firmInBeta: false);

        $this->actingAs($user)->getJson('/api/v1/voice/status')->assertJsonPath('data.associate_available', false);
        startCall($user)->assertForbidden()->assertJsonPath('error', 'associate_unavailable');
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'conversation/token'));
    });

    it('needs the voice consent and a minute of credits', function (): void {
        startCall(associateLawyer(consented: false))->assertForbidden()->assertJsonPath('error', 'voice_consent_required');

        $user = associateLawyer();
        app(AiCreditService::class)->getOrCreateWallet($user->tenant)->forceFill(['free_balance' => 1, 'paid_balance' => 0])->save();
        startCall($user)->assertStatus(402)->assertJsonPath('error', 'insufficient_credits');
    });

    it('bills the real call length once the call ends, and only once', function (): void {
        $user = associateLawyer();
        $before = walletTotal($user);
        $session = startCall($user)->json('data.session_public_id');

        // 130 seconds: 3 started minutes x 2 credits.
        $this->postJson("/api/v1/voice/associate/sessions/{$session}/end")->assertOk();
        FinalizeVoiceSessionJob::dispatchSync($user->tenant_id, VoiceSession::query()->withoutGlobalScopes()->sole()->id);

        $billed = VoiceSession::query()->withoutGlobalScopes()->sole();
        expect($billed->status)->toBe(VoiceSession::BILLED);
        expect($billed->duration_seconds)->toBe(130);
        expect($billed->credits_charged)->toBe(6);
        expect(walletTotal($user))->toBe($before - 6);
        expect(AiCreditLedger::query()->withoutGlobalScopes()->where('feature', 'voice_associate')->count())->toBe(1);
    });

    it('bills calls whose tab was closed, from the scheduler', function (): void {
        $user = associateLawyer();
        startCall($user)->assertCreated();

        $this->travel(20)->minutes();
        $this->artisan('voice:finalize-sessions')->assertSuccessful();

        expect(VoiceSession::query()->withoutGlobalScopes()->sole()->status)->toBe(VoiceSession::BILLED);
    });

    it('lets only the caller end their own call', function (): void {
        $user = associateLawyer();
        $session = startCall($user)->json('data.session_public_id');

        $other = associateLawyer();
        app('auth')->forgetGuards();
        $this->actingAs($other)->postJson("/api/v1/voice/associate/sessions/{$session}/end")->assertNotFound();
    });

    it('charges nothing when ElevenLabs will not start the call', function (): void {
        $user = associateLawyer();
        $GLOBALS['assoc_replies']['conversation/token'] = Http::response(['detail' => 'quota'], 429);
        $before = walletTotal($user);

        startCall($user)->assertStatus(502)->assertJsonPath('error', 'associate_failed');
        expect(walletTotal($user))->toBe($before);
        expect(VoiceSession::query()->withoutGlobalScopes()->count())->toBe(0);
    });
});
