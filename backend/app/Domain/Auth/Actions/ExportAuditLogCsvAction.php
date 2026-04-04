<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\AuditLog;
use App\Domain\Tenancy\Models\Tenant;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportAuditLogCsvAction
{
    /**
     * @param array{days?: int|null, action?: string|null} $filters
     */
    public function handle(Tenant $tenant, array $filters = []): StreamedResponse
    {
        $query = AuditLog::query()
            ->withoutGlobalScopes()
            ->with(['user:id,public_id,name,email'])
            ->where('tenant_id', $tenant->id)
            ->when(
                isset($filters['days']) && $filters['days'] !== null,
                fn ($builder) => $builder->where('created_at', '>=', now()->subDays((int) $filters['days']))
            )
            ->when(
                isset($filters['action']) && $filters['action'] !== null && $filters['action'] !== '',
                fn ($builder) => $builder->where('action', (string) $filters['action'])
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $windowSuffix = isset($filters['days']) && $filters['days'] !== null
            ? sprintf('last-%sd', $filters['days'])
            : 'all-time';

        $filename = sprintf(
            'casedex-audit-export-%s-%s-%s.csv',
            $tenant->public_id,
            $windowSuffix,
            now()->format('Ymd-His')
        );

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // UTF-8 BOM keeps Bangla text readable in common spreadsheet apps.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'created_at',
                'actor_public_id',
                'actor_name',
                'actor_email',
                'action',
                'target_type',
                'target_id',
                'metadata',
            ]);

            foreach ($query->cursor() as $log) {
                fputcsv($handle, [
                    $log->created_at?->toIso8601String(),
                    $log->user?->public_id,
                    $log->user?->name,
                    $log->user?->email,
                    $log->action,
                    $this->normalizeTargetType($log->target_type),
                    $log->target_id,
                    $this->encodeMetadata($log->metadata),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function normalizeTargetType(?string $targetType): ?string
    {
        if ($targetType === null || $targetType === '') {
            return null;
        }

        if (! str_contains($targetType, '\\')) {
            return $targetType;
        }

        return class_basename($targetType);
    }

    /**
     * @param array<string, mixed>|null $metadata
     */
    private function encodeMetadata(?array $metadata): string
    {
        if ($metadata === null || $metadata === []) {
            return '';
        }

        $encoded = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return is_string($encoded) ? $encoded : '';
    }
}
