<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Courts\Models\Court;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateCaseAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CaseFile $case, array $data, ?Authenticatable $user): CaseFile
    {
        $payload = $data;

        if (array_key_exists('court_public_id', $payload)) {
            $court = null;
            if (! empty($payload['court_public_id'])) {
                $court = Court::query()
                    ->where('public_id', $payload['court_public_id'])
                    ->first();
            }

            if ($court !== null) {
                $payload['court_id'] = $court->id;
                $payload['court'] = $court->displayName(app()->getLocale());
            }

            unset($payload['court_public_id']);
        }

        $case->fill($payload);
        $case->save();

        $this->auditLog->handle(
            'case.updated',
            $user,
            CaseFile::class,
            $case->public_id
        );

        return $case;
    }
}
