<?php

namespace App\Domain\Notifications\Push;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Sends notifications to Android and iOS apps through the Firebase Cloud
 * Messaging HTTP v1 API, authenticated with a Google service account.
 */
class FcmSender implements MobilePushSender
{
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
    private const ACCESS_TOKEN_CACHE_KEY = 'fcm:access_token';

    public function isConfigured(): bool
    {
        return filled(config('services.fcm.project_id')) && filled(config('services.fcm.credentials'));
    }

    public function send(string $pushToken, array $payload): string
    {
        $projectId = (string) config('services.fcm.project_id');

        $response = Http::withToken($this->accessToken())
            ->timeout(15)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $pushToken,
                    'notification' => ['title' => $payload['title'], 'body' => $payload['body']],
                    // FCM data values must be strings.
                    'data' => ['url' => $payload['url']] + $payload['data'],
                    'android' => ['priority' => 'high'],
                    'apns' => ['payload' => ['aps' => ['sound' => 'default']]],
                ],
            ]);

        if ($response->successful()) {
            return self::SENT;
        }

        $errorCode = (string) collect($response->json('error.details', []))
            ->pluck('errorCode')
            ->filter()
            ->first();

        // The app was uninstalled or the token rotated: stop using it.
        if ($response->status() === 404 || $errorCode === 'UNREGISTERED') {
            return self::EXPIRED;
        }

        if ($response->status() === 401) {
            Cache::forget(self::ACCESS_TOKEN_CACHE_KEY);
        }

        Log::warning('push.mobile_failed', ['status' => $response->status(), 'error_code' => $errorCode ?: null]);

        return self::FAILED;
    }

    /** OAuth access token for the service account, cached until shortly before it expires. */
    private function accessToken(): string
    {
        $cached = Cache::get(self::ACCESS_TOKEN_CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $account = $this->serviceAccount();
        $now = time();
        $assertion = $this->signJwt([
            'iss' => $account['client_email'],
            'scope' => self::SCOPE,
            'aud' => $account['token_uri'],
            'iat' => $now,
            'exp' => $now + 3600,
        ], $account['private_key']);

        $response = Http::asForm()->timeout(15)->post($account['token_uri'], [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $assertion,
        ]);

        $token = (string) $response->json('access_token');
        if (! $response->successful() || $token === '') {
            // Never log the response body: it can echo credential details.
            throw new RuntimeException("FCM token exchange failed with status {$response->status()}.");
        }

        $ttl = max(60, (int) $response->json('expires_in', 3600) - 300);
        Cache::put(self::ACCESS_TOKEN_CACHE_KEY, $token, $ttl);

        return $token;
    }

    /**
     * @return array{client_email: string, private_key: string, token_uri: string}
     */
    private function serviceAccount(): array
    {
        $raw = (string) config('services.fcm.credentials');
        $json = str_starts_with(ltrim($raw), '{') ? $raw : (is_readable($raw) ? (string) file_get_contents($raw) : '');
        $account = json_decode($json, true);

        if (! is_array($account) || empty($account['client_email']) || empty($account['private_key'])) {
            throw new RuntimeException('FCM_CREDENTIALS is not a valid service-account JSON (or path to one).');
        }

        return [
            'client_email' => (string) $account['client_email'],
            'private_key' => (string) $account['private_key'],
            'token_uri' => (string) ($account['token_uri'] ?? 'https://oauth2.googleapis.com/token'),
        ];
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function signJwt(array $claims, string $privateKey): string
    {
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $input = $encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR))
            .'.'.$encode(json_encode($claims, JSON_THROW_ON_ERROR));

        if (! openssl_sign($input, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Could not sign the FCM service-account assertion.');
        }

        return $input.'.'.$encode($signature);
    }
}
