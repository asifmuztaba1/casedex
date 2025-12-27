<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\Models\Country;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CountryResource;

class CountryController extends Controller
{
    public function index()
    {
        $countries = Country::query()
            ->orderBy('name')
            ->get();

        return CountryResource::collection($countries);
    }
}
