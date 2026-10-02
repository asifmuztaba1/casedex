<?php

use App\Domain\Notifications\Push\FcmSender;
use App\Domain\Notifications\Push\MobilePushSender;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * @return string the PEM public key matching the configured service account
 */
function configureFakeServiceAccount(): string
{
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
    openssl_pkey_export($key, $privatePem);

    config([
        'services.fcm.project_id' => 'casedex-test',
        'services.fcm.credentials' => json_encode([
            'type' => 'service_account',
            'client_email' => 'push@casedex-test.iam.gserviceaccount.com',
            'private_key' => $privatePem,
            'token_uri' => 'https://oauth2.googleapis.com/token',
        ]),
    ]);
    Cache::forget('fcm:access_token');

    return openssl_pkey_get_details($key)['key'];
}

function fcmPayload(): array
{
    return [
        'title' => 'Hearing reminder',
        'body' => 'Reminder: hearing scheduled for tomorrow.',
        'url' => '/cases/01CASE',
        'data' => ['case_public_id' => '01CASE', 'notification_type' => 'hearing_reminder'],
    ];
}

it('is not configured without a project id and credentials', function (): void {
    config(['services.fcm.project_id' => null, 'services.fcm.credentials' => null]);

    expect((new FcmSender)->isConfigured())->toBeFalse();
});

it('signs a service-account assertion, then sends the message with the access token', function (): void {
    $publicKey = configureFakeServiceAccount();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'ya29.test', 'expires_in' => 3600]),
        'fcm.googleapis.com/*' => Http::response(['name' => 'projects/casedex-test/messages/1']),
    ]);

    $result = (new FcmSender)->send('fcm-device-token', fcmPayload());

    expect($result)->toBe(MobilePushSender::SENT);

    Http::assertSent(function (Request $request) use ($publicKey): bool {
        if ($request->url() !== 'https://oauth2.googleapis.com/token') {
            return false;
        }
        [$header, $claims, $signature] = explode('.', $request['assertion']);
        $decode = fn (string $part): string => base64_decode(strtr($part, '-_', '+/'));
        $verified = openssl_verify("{$header}.{$claims}", $decode($signature), $publicKey, OPENSSL_ALGO_SHA256) === 1;
        $claims = json_decode($decode($claims), true);

        return $verified
            && $request['grant_type'] === 'urn:ietf:params:oauth:grant-type:jwt-bearer'
            && $claims['iss'] === 'push@casedex-test.iam.gserviceaccount.com'
            && $claims['scope'] === 'https://www.googleapis.com/auth/firebase.messaging';
    });

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://fcm.googleapis.com/v1/projects/casedex-test/messages:send'
        && $request->header('Authorization') === ['Bearer ya29.test']
        && $request['message']['token'] === 'fcm-device-token'
        && $request['message']['notification'] === ['title' => 'Hearing reminder', 'body' => 'Reminder: hearing scheduled for tomorrow.']
        && $request['message']['data'] === ['url' => '/cases/01CASE', 'case_public_id' => '01CASE', 'notification_type' => 'hearing_reminder']);
});

it('reuses the access token across sends', function (): void {
    configureFakeServiceAccount();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'ya29.test', 'expires_in' => 3600]),
        'fcm.googleapis.com/*' => Http::response(['name' => 'ok']),
    ]);

    $sender = new FcmSender;
    $sender->send('device-a', fcmPayload());
    $sender->send('device-b', fcmPayload());

    Http::assertSentCount(3); // one token exchange, two messages
});

it('reports uninstalled apps as expired and other errors as failed', function (int $status, array $body, string $expected): void {
    configureFakeServiceAccount();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'ya29.test', 'expires_in' => 3600]),
        'fcm.googleapis.com/*' => Http::response($body, $status),
    ]);

    expect((new FcmSender)->send('fcm-device-token', fcmPayload()))->toBe($expected);
})->with([
    'not found' => [404, ['error' => ['status' => 'NOT_FOUND']], MobilePushSender::EXPIRED],
    'unregistered' => [400, ['error' => ['details' => [['@type' => 'type.googleapis.com/google.firebase.fcm.v1.FcmError', 'errorCode' => 'UNREGISTERED']]]], MobilePushSender::EXPIRED],
    'server error' => [500, ['error' => ['status' => 'INTERNAL']], MobilePushSender::FAILED],
    'quota' => [429, ['error' => ['details' => [['errorCode' => 'QUOTA_EXCEEDED']]]], MobilePushSender::FAILED],
]);

it('accepts the service-account JSON as a file path', function (): void {
    configureFakeServiceAccount();
    $path = tempnam(sys_get_temp_dir(), 'fcm');
    file_put_contents($path, config('services.fcm.credentials'));
    config(['services.fcm.credentials' => $path]);
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'ya29.test', 'expires_in' => 3600]),
        'fcm.googleapis.com/*' => Http::response(['name' => 'ok']),
    ]);

    expect((new FcmSender)->send('fcm-device-token', fcmPayload()))->toBe(MobilePushSender::SENT);
    unlink($path);
});
