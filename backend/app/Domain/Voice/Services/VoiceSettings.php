<?php

namespace App\Domain\Voice\Services;

use App\Domain\Platform\Models\PlatformSetting;
use Illuminate\Support\Facades\Crypt;

/**
 * Platform-wide voice settings, edited in Admin → Voice: whether voice is on,
 * the ElevenLabs API key (encrypted with APP_KEY, never returned), and
 * whether to ask ElevenLabs not to retain audio (needs their Enterprise plan).
 */
class VoiceSettings
{
    private const ENABLED = 'voice.enabled';
    private const API_KEY = 'voice.elevenlabs_api_key';
    private const ZERO_RETENTION = 'voice.zero_retention';
    private const ASSOCIATE_AGENT = 'voice.associate_agent_id';
    private const ASSOCIATE_TOOLS = 'voice.associate_tool_ids';

    public function enabled(): bool
    {
        return (bool) $this->value(self::ENABLED);
    }

    public function apiKey(): ?string
    {
        $encrypted = $this->value(self::API_KEY);
        if (! is_string($encrypted) || $encrypted === '') {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            // APP_KEY rotated: the key must be entered again.
            return null;
        }
    }

    public function zeroRetention(): bool
    {
        return (bool) $this->value(self::ZERO_RETENTION);
    }

    /** Voice can be used: switched on and a key saved. */
    public function isAvailable(): bool
    {
        return $this->enabled() && $this->apiKey() !== null;
    }

    public function update(bool $enabled, bool $zeroRetention, ?string $apiKey, int $adminUserId): void
    {
        $this->put(self::ENABLED, $enabled, $adminUserId);
        $this->put(self::ZERO_RETENTION, $zeroRetention, $adminUserId);
        if ($apiKey !== null && $apiKey !== '') {
            $this->put(self::API_KEY, Crypt::encryptString($apiKey), $adminUserId);
        }
    }

    /** The ElevenLabs agent for the junior associate, once set up from Admin → Voice. */
    public function associateAgentId(): ?string
    {
        $id = $this->value(self::ASSOCIATE_AGENT);

        return is_string($id) && $id !== '' ? $id : null;
    }

    /**
     * @return array<int, string>
     */
    public function associateToolIds(): array
    {
        $ids = $this->value(self::ASSOCIATE_TOOLS);

        return is_array($ids) ? array_values(array_filter($ids, 'is_string')) : [];
    }

    /**
     * @param  array<int, string>  $toolIds
     */
    public function saveAssociate(string $agentId, array $toolIds, int $adminUserId): void
    {
        $this->put(self::ASSOCIATE_AGENT, $agentId, $adminUserId);
        $this->put(self::ASSOCIATE_TOOLS, array_values($toolIds), $adminUserId);
    }

    private function value(string $key): mixed
    {
        return PlatformSetting::query()->where('key', $key)->value('value');
    }

    private function put(string $key, mixed $value, int $adminUserId): void
    {
        PlatformSetting::query()->updateOrCreate(['key' => $key], ['value' => $value, 'updated_by' => $adminUserId]);
    }
}
