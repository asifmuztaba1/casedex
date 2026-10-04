<?php

namespace App\Domain\Voice\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * The ElevenLabs API calls CaseDex makes. Errors never include the key.
 */
class ElevenLabsClient
{
    private const BASE_URL = 'https://api.elevenlabs.io';

    public function __construct(private readonly VoiceSettings $settings)
    {
    }

    /**
     * Speech to text with Scribe. Audio is sent straight through; CaseDex
     * does not store it.
     *
     * @return array{text: string, language_code: ?string, duration_seconds: float}
     */
    public function transcribe(UploadedFile $audio, ?string $languageCode = null): array
    {
        $query = $this->settings->zeroRetention() ? '?enable_logging=false' : '';

        $response = Http::withHeaders(['xi-api-key' => $this->key()])
            ->timeout(60)
            ->attach('file', (string) file_get_contents($audio->getRealPath()), $audio->getClientOriginalName() ?: 'dictation.webm')
            ->post(self::BASE_URL.'/v1/speech-to-text'.$query, array_filter([
                'model_id' => 'scribe_v2',
                'language_code' => $languageCode,
                'tag_audio_events' => 'false',
            ], fn ($value): bool => $value !== null));

        if (! $response->successful()) {
            $message = $this->describe($response->status(), $response->json('detail.message') ?? $response->json('detail'));
            throw new RuntimeException(str_replace($this->key(), '[key]', $message));
        }

        $words = collect($response->json('words', []));

        return [
            'text' => trim((string) $response->json('text', '')),
            'language_code' => $response->json('language_code'),
            'duration_seconds' => (float) ($words->max('end') ?? 0),
        ];
    }

    /**
     * Checks the key works, for the admin page.
     *
     * @return array{ok: bool, error: ?string}
     */
    public function testKey(string $apiKey): array
    {
        try {
            $response = Http::withHeaders(['xi-api-key' => $apiKey])->timeout(15)->get(self::BASE_URL.'/v1/models');
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'Could not reach ElevenLabs.'];
        }

        return $response->successful()
            ? ['ok' => true, 'error' => null]
            : ['ok' => false, 'error' => str_replace($apiKey, '[key]', $this->describe($response->status(), $response->json('detail.message') ?? $response->json('detail')))];
    }

    /** Creates a client tool for the associate agent and returns its id. */
    public function createTool(array $toolConfig): string
    {
        return (string) $this->json('post', '/v1/convai/tools', ['tool_config' => $toolConfig])['id'];
    }

    /** Best effort: tools replaced by a newer setup are removed. */
    public function deleteTool(string $toolId): void
    {
        try {
            Http::withHeaders(['xi-api-key' => $this->key()])->timeout(15)->delete(self::BASE_URL.'/v1/convai/tools/'.rawurlencode($toolId));
        } catch (\Throwable) {
            // An orphaned tool costs nothing; ignore.
        }
    }

    public function createAgent(array $config): string
    {
        return (string) $this->json('post', '/v1/convai/agents/create', $config)['agent_id'];
    }

    public function updateAgent(string $agentId, array $config): void
    {
        $this->json('patch', '/v1/convai/agents/'.rawurlencode($agentId), $config);
    }

    /**
     * A short-lived WebRTC token for one conversation, and that conversation's id.
     *
     * @return array{token: string, conversation_id: ?string}
     */
    public function conversationToken(string $agentId): array
    {
        $body = $this->json('get', '/v1/convai/conversation/token?agent_id='.rawurlencode($agentId));

        return ['token' => (string) $body['token'], 'conversation_id' => $body['conversation_id'] ?? null];
    }

    /**
     * @return array{status: ?string, duration_seconds: ?int}
     */
    public function conversation(string $conversationId): array
    {
        $body = $this->json('get', '/v1/convai/conversations/'.rawurlencode($conversationId));
        $duration = $body['metadata']['call_duration_secs'] ?? $body['call_duration_secs'] ?? null;

        return ['status' => $body['status'] ?? null, 'duration_seconds' => $duration === null ? null : (int) $duration];
    }

    /**
     * @return array<string, mixed>
     */
    private function json(string $method, string $path, array $payload = []): array
    {
        $request = Http::withHeaders(['xi-api-key' => $this->key()])->acceptJson()->timeout(30);
        $response = $method === 'get' ? $request->get(self::BASE_URL.$path) : $request->{$method}(self::BASE_URL.$path, $payload);

        if (! $response->successful()) {
            $message = $this->describe($response->status(), $response->json('detail.message') ?? $response->json('detail'));
            throw new RuntimeException(str_replace($this->key(), '[key]', $message));
        }

        return (array) $response->json();
    }

    private function key(): string
    {
        return $this->settings->apiKey() ?? throw new RuntimeException('ElevenLabs is not configured.');
    }

    private function describe(int $status, mixed $detail): string
    {
        $detail = is_string($detail) ? mb_substr($detail, 0, 200) : '';

        return "ElevenLabs returned HTTP {$status}".($detail !== '' ? ": {$detail}" : '.');
    }
}
