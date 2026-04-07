<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListClientsAction
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function handle(int $perPage, ?string $cursor, array $filters = []): CursorPaginator
    {
        $query = Client::query()
            ->where('tenant_id', TenantContext::id())
            ->withCount('caseParties');

        if (isset($filters['is_client'])) {
            $query->where('is_client', filter_var($filters['is_client'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhere('identity_number', 'like', "%{$term}%");
            });
        }

        return $query
            ->orderBy('name')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
