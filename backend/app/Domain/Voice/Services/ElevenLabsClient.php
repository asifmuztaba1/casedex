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
