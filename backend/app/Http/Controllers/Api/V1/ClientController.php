<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Clients\Actions\CreateClientAction;
use App\Domain\Clients\Actions\DeleteClientAction;
use App\Domain\Clients\Actions\FindClientAction;
use App\Domain\Clients\Actions\FindClientWithCaseHistoryAction;
use App\Domain\Clients\Actions\ListClientsAction;
use App\Domain\Clients\Actions\UpdateClientAction;
use App\Domain\Clients\Models\Client;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreClientRequest;
use App\Http\Requests\Api\V1\UpdateClientRequest;
use App\Http\Resources\Api\V1\ClientDetailResource;
use App\Http\Resources\Api\V1\ClientResource;
use App\Support\TenantContext;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(IndexRequest $request, ListClientsAction $action)
    {
        $this->authorize('viewAny', Client::class);

        $perPage = (int) ($request->input('per_page', 25));

        $filters = $request->only(['search', 'is_client', 'type']);

        $clients = $action->handle($perPage, $request->input('cursor'), $filters);

        return ClientResource::collection($clients);
    }

    public function store(StoreClientRequest $request, CreateClientAction $action)
    {
        $this->authorize('create', Client::class);

        $client = $action->handle($request->validated(), $request->user());

        return new ClientResource($client);
    }

    public function show(int $id, FindClientWithCaseHistoryAction $action)
    {
        $client = $action->handle($id);

        $this->authorize('view', $client);

        return new ClientDetailResource($client);
    }

    public function update(
        int $id,
        UpdateClientRequest $request,
        FindClientAction $finder,
        UpdateClientAction $action
    ) {
        $client = $finder->handle($id);

        $this->authorize('update', $client);

        $client = $action->handle($client, $request->validated(), $request->user());

        return new ClientResource($client);
    }

    public function destroy(
        int $id,
        Request $request,
        FindClientAction $finder,
        DeleteClientAction $action
    ) {
        $client = $finder->handle($id);

        $this->authorize('delete', $client);

        $action->handle($client, $request->user());

        return response()->noContent();
    }

    public function search(Request $request)
    {
        $this->authorize('viewAny', Client::class);

        $term = $request->input('q', '');

        if (strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $contacts = Client::query()
            ->where('tenant_id', TenantContext::id())
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('identity_number', 'like', "%{$term}%");
            })
            ->withCount('caseParties')
            ->orderBy('name')
            ->limit(10)
            ->get();

        return ClientResource::collection($contacts);
    }
}
