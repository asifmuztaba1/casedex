<?php

namespace App\Domain\Ai\Actions;

use App\Domain\Ai\Models\AiProviderSetting;
use App\Domain\Ai\Services\AiProviderFactory;
use Illuminate\Http\Client\RequestException;
use Throwable;

/**
 * Sends a one-word prompt with a provider's saved settings so an admin can
 * see whether the key and model work before making it active.
 */
class TestAiProviderAction
{
    public function __construct(private readonly AiProviderFactory $factory)
    {
    }

    /**
     * @return array{ok: bool, latency_ms: int, reply: ?string, error: ?string}
     */
    public function handle(AiProviderSetting $setting): array
    {
        $config = $this->factory->configFor($setting);
        $started = microtime(true);

        try {
            $result = $this->factory->makeFor($config)->complete([
                ['role' => 'system', 'content' => 'Reply with the single word OK.'],
                ['role' => 'user', 'content' => 'Connection test'],
            ], ['temperature' => 0]);
            $outcome = ['ok' => true, 'reply' => mb_substr(trim($result['content']), 0, 40), 'error' => null];
        } catch (Throwable $e) {
            $outcome = ['ok' => false, 'reply' => null, 'error' => $this->describe($e, $config->apiKey)];
        }

        $setting->forceFill(['last_tested_at' => now(), 'last_test_ok' => $outcome['ok']])->save();

        return $outcome + ['latency_ms' => (int) round((microtime(true) - $started) * 1000)];
    }

    /** A readable reason that never contains the key. */
    private function describe(Throwable $e, string $apiKey): string
    {
        if ($e instanceof RequestException) {
            $status = $e->response->status();
            $detail = (string) ($e->response->json('error.message') ?? $e->response->json('error') ?? '');
            $message = "HTTP {$status} from the provider".($detail !== '' ? ': '.mb_substr($detail, 0, 200) : '.');
        } else {
            $message = mb_substr($e->getMessage(), 0, 200);
        }

        return $apiKey !== '' ? str_replace($apiKey, '[key]', $message) : $message;
    }
}
