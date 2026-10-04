<?php

use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

const ELEVENLABS_KEY = 'sk_live_elevenlabs_SECRET_1234';

beforeEach(function (): void {
    Config::set('billing.ai.monthly_free_credits', 100);
    Config::set('billing.ai.voice.dictation_seconds_per_credit', 120);

    // One fake for the whole test; a test swaps a response with elevenLabsReplies().
    $GLOBALS['elevenlabs_replies'] = [
        'speech-to-text' => Http::response([
            'text' => 'শুনানি ১২ নভেম্বর পর্যন্ত মুলতবি। Affidavit দিতে হবে।',
            'language_code' => 'ben',
            'words' => [['text' => 'শুনানি', 'start' => 0.2, 'end' => 0.9], ['text' => 'হবে।', 'start' => 94.1, 'end' => 95.0]],
        ]),
        'models' => Http::response([['model_id' => 'scribe_v2']]),
    ];
    Http::fake(function (Request $request) {
        foreach ($GLOBALS['elevenlabs_replies'] as $path => $reply) {
            if (str_contains($request->url(), '/v1/'.$path)) {
                return $reply;
            }
        }

        return Http::response('unexpected request', 500);
    });
});

function elevenLabsReplies(string $path, mixed $reply): void
{
    $GLOBALS['elevenlabs_replies'][$path] = $reply;
}

function voiceAdmin(UserRole $role = UserRole::PlatformAdmin): User
{
    return User::factory()->create(['tenant_id' => null, 'role' => $role]);
}

function switchVoiceOn(bool $zeroRetention = false): void
{
    app('auth')->forgetGuards();
    test()->actingAs(voiceAdmin())->putJson('/api/v1/admin/voice', [
        'enabled' => true, 'zero_retention' => $zeroRetention, 'api_key' => ELEVENLABS_KEY,
    ])->assertOk();
    app('auth')->forgetGuards();
}

/** A lawyer in a workspace on an active plan, with this month's free AI credits. */
function dictatingLawyer(bool $consented = true): User
{
    [, $user] = createAiQaTenantUser(role: UserRole::Lawyer, withActiveSubscription: true, plan: TenantPlan::Professional);
    if ($consented) {
        $user->forceFill(['voice_consent_at' => now()])->save();
    }

    return $user;
}

function dictate(User $user, int $seconds = 30, string $file = 'note.webm', string $mime = 'audio/webm'): Illuminate\Testing\TestResponse
{
    app('auth')->forgetGuards();

    return test()->actingAs($user)->post('/api/v1/voice/transcriptions', [
        'audio' => UploadedFile::fake()->create($file, 120, $mime),
        'duration_seconds' => $seconds,
    ], ['Accept' => 'application/json']);
}

function creditsLeft(User $user): int
{
    $wallet = app(AiCreditService::class)->getOrCreateWallet($user->tenant);

    return $wallet->fresh()->free_balance + $wallet->fresh()->paid_balance;
}

describe('Admin → Voice', function (): void {
    it('stores the ElevenLabs key encrypted and never returns it', function (): void {
        $this->actingAs(voiceAdmin());

        $response = $this->putJson('/api/v1/admin/voice', ['enabled' => true, 'zero_retention' => false, 'api_key' => ELEVENLABS_KEY])->assertOk();

        expect($response->getContent())->not->toContain(ELEVENLABS_KEY);
        expect($response->json('data'))->toMatchArray(['enabled' => true, 'has_api_key' => true, 'api_key_last4' => '1234', 'available' => true]);
        expect(DB::table('platform_settings')->where('key', 'voice.elevenlabs_api_key')->value('value'))->not->toContain('SECRET');
        expect($this->getJson('/api/v1/admin/voice')->getContent())->not->toContain(ELEVENLABS_KEY);
    });

    it('keeps the key when settings change without one', function (): void {
        switchVoiceOn();
        $this->actingAs(voiceAdmin())->putJson('/api/v1/admin/voice', ['enabled' => false, 'zero_retention' => true])
            ->assertOk()->assertJsonPath('data.api_key_last4', '1234')->assertJsonPath('data.available', false);
    });

    it('tests the key and hides it in errors', function (): void {
        switchVoiceOn();
        $this->actingAs(voiceAdmin())->postJson('/api/v1/admin/voice/test')->assertOk()->assertJsonPath('data.ok', true);

        elevenLabsReplies('models', Http::response(['detail' => ['message' => 'Invalid API key '.ELEVENLABS_KEY]], 401));
        $result = $this->postJson('/api/v1/admin/voice/test')->assertOk()->json('data');
        expect($result['ok'])->toBeFalse();
        expect($result['error'])->toContain('HTTP 401')->not->toContain(ELEVENLABS_KEY);
    });

    it('lets platform editors look but not change voice settings', function (): void {
        $this->actingAs(voiceAdmin(UserRole::PlatformEditor));

        $this->getJson('/api/v1/admin/voice')->assertOk()->assertJsonPath('data.can_edit', false);
        $this->putJson('/api/v1/admin/voice', ['enabled' => true, 'zero_retention' => false, 'api_key' => ELEVENLABS_KEY])->assertForbidden();
    });
});

describe('dictation', function (): void {
    it('says voice is unavailable until an admin switches it on', function (): void {
        $user = dictatingLawyer();
        $this->actingAs($user)->getJson('/api/v1/voice/status')->assertJsonPath('data.dictation_available', false);

        dictate($user)->assertStatus(503)->assertJsonPath('error', 'voice_unavailable');
        Http::assertNothingSent();
    });

    it('asks for consent once before the first recording', function (): void {
        switchVoiceOn();
        $user = dictatingLawyer(consented: false);

        dictate($user)->assertForbidden()->assertJsonPath('error', 'voice_consent_required');
        $this->actingAs($user)->postJson('/api/v1/voice/consent')->assertOk();

        expect($user->fresh()->voice_consent_at)->not->toBeNull();
        expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'voice.consent_given')->count())->toBe(1);
        dictate($user)->assertOk();
    });

    it('turns speech into text for review, charging credits by length', function (): void {
        switchVoiceOn();
        $user = dictatingLawyer();
        $before = creditsLeft($user);

        // The app says 30 s but ElevenLabs heard 95 s: bill the longer, 1 credit per started 120 s.
        $result = dictate($user, 30)->assertOk()->json('data');

        expect($result['text'])->toBe('শুনানি ১২ নভেম্বর পর্যন্ত মুলতবি। Affidavit দিতে হবে।');
        expect($result)->toMatchArray(['duration_seconds' => 95, 'credits_charged' => 1]);
        expect(creditsLeft($user))->toBe($before - 1);
        expect(AiCreditLedger::query()->withoutGlobalScopes()->where('feature', 'voice_dictation')->count())->toBe(1);

        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api.elevenlabs.io/v1/speech-to-text'
            && $request->header('xi-api-key') === [ELEVENLABS_KEY]
            && collect($request->data())->contains(fn ($part): bool => ($part['name'] ?? null) === 'model_id' && $part['contents'] === 'scribe_v2'));

        $audit = AuditLog::query()->withoutGlobalScopes()->where('action', 'voice.transcribed')->sole();
        expect($audit->metadata)->toEqual(['seconds' => 95, 'credits' => 1]); // key order differs between SQLite and MySQL JSON
        expect(json_encode($audit->metadata))->not->toContain('শুনানি');
    });

    it('charges more for longer recordings', function (): void {
        switchVoiceOn();
        $user = dictatingLawyer();

        dictate($user, 150)->assertOk()->assertJsonPath('data.credits_charged', 2);
    });

    it('asks ElevenLabs not to keep the audio when zero retention is on', function (): void {
        switchVoiceOn(zeroRetention: true);

        dictate(dictatingLawyer())->assertOk();

        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api.elevenlabs.io/v1/speech-to-text?enable_logging=false');
    });

    it('charges nothing when ElevenLabs fails', function (): void {
        switchVoiceOn();
        elevenLabsReplies('speech-to-text', Http::response(['detail' => 'quota exceeded'], 429));
        $user = dictatingLawyer();
        $before = creditsLeft($user);

        dictate($user)->assertStatus(502)->assertJsonPath('error', 'transcription_failed');
        expect(creditsLeft($user))->toBe($before);
    });

    it('stops before sending audio when the firm is out of credits', function (): void {
        switchVoiceOn();
        $user = dictatingLawyer();
        $wallet = app(AiCreditService::class)->getOrCreateWallet($user->tenant);
        $wallet->forceFill(['free_balance' => 0, 'paid_balance' => 0])->save();

        dictate($user)->assertStatus(402)->assertJsonPath('error', 'insufficient_credits');
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'speech-to-text'));
    });

    it('refuses long recordings and non-audio files', function (): void {
        switchVoiceOn();
        $user = dictatingLawyer();

        dictate($user, 600)->assertUnprocessable()->assertJsonValidationErrors('duration_seconds');
        dictate($user, 30, 'notes.pdf', 'application/pdf')->assertUnprocessable()->assertJsonValidationErrors('audio');
    });

    it('needs an active plan', function (): void {
        switchVoiceOn();
        [, $user] = createAiQaTenantUser(role: UserRole::Lawyer, withActiveSubscription: false);
        $user->forceFill(['voice_consent_at' => now()])->save();

        dictate($user)->assertForbidden()->assertJsonPath('error', 'subscription_required');
    });
});
