<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Courts\Models\Court;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CourtResource;
use App\Support\TenantContext;
use Illuminate\Http\Request;

class CourtLookupController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = TenantContext::id();
        $countryId = null;

        if ($tenantId) {
            $countryId = Tenant::query()
                ->where('id', $tenantId)
                ->value('country_id');
        }

        if ($countryId === null && $request->filled('country_code')) {
            $countryId = Country::query()
                ->where('code', $request->input('country_code'))
                ->value('id');
        }

        $query = Court::query()
            ->with(['division', 'district', 'type'])
            ->when($countryId, fn ($builder) => $builder->where('country_id', $countryId))
            ->where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('name_bn', 'like', "%{$search}%")
                    ->orWhereHas('district', function ($districtQuery) use ($search): void {
                        $districtQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('name_bn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('division', function ($divisionQuery) use ($search): void {
                        $divisionQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('name_bn', 'like', "%{$search}%");
                    });
            });
        }

        $courts = $query
            ->orderBy('name')
            ->limit(50)
            ->get();

        return CourtResource::collection($courts);
    }
}
