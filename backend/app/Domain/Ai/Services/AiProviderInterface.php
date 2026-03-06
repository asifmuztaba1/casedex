<?php

namespace App\Domain\Ai\Services;

interface AiProviderInterface
{
    /**
     * @param array<int, array<string, string>> $messages
     * @return array{content: string, raw: array<string, mixed>}
     */
    public function complete(array $messages, array $options = []): array;
}
