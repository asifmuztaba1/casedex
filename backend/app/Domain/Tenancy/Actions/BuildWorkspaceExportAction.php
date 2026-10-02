<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Clients\Models\Client;
use App\Domain\Research\Models\ResearchNote;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Models\User;
use App\Support\WallClock;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

/**
 * Writes a workspace's data to a zip on the default disk:
 *
 *   README.txt        what is inside
 *   data/*.json       every case with its client, parties, team, hearings,
 *                     diary entries and document list; contacts; notes; team
 *   csv/*.csv         the same, flattened for spreadsheets
 *   documents/…       the uploaded files, one folder per case
 *
 * Records are identified by public ids only. Runs inside the workspace's
 * tenant context (BuildWorkspaceExportJob sets it).
 */
class BuildWorkspaceExportAction
{
    /** Columns never written to an export. */
    private const INTERNAL_KEYS = ['id', 'tenant_id', 'storage_key', 'deleted_at'];

    /** Bangladesh wall-clock times: written without a time zone, as in the API. */
    private const WALL_CLOCK_KEYS = ['hearing_at', 'entry_at', 'due_at'];

    /** @var array<string, true> zip paths already used */
    private array $usedPaths = [];

    /**
     * @return array{path: string, size: int}
     */
    public function handle(WorkspaceExport $export): array
    {
        $tenant = Tenant::query()->findOrFail($export->tenant_id);
        $this->usedPaths = [];

        $localZip = tempnam(sys_get_temp_dir(), 'casedex-export');
        $zip = new ZipArchive;
        if ($zip->open($localZip, ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create the export archive.');
        }

        $root = 'casedex-export-'.Str::slug((string) $tenant->name ?: 'workspace').'-'.now()->format('Y-m-d');
        $disk = Storage::disk(config('filesystems.default'));

        [$cases, $fileCount, $missingFiles] = $this->exportCases($zip, $root, $disk);
        $contacts = Client::query()->orderBy('name')->get()->map(fn (Client $c): array => $this->row($c))->all();
        $notes = ResearchNote::query()->orderBy('created_at')->get()->map(fn (ResearchNote $n): array => $this->row($n))->all();
        $team = User::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('name')
            ->get()
            ->map(fn (User $u): array => ['public_id' => $u->public_id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role?->value])
            ->all();

        $this->addJson($zip, "{$root}/data/cases.json", $cases);
        $this->addJson($zip, "{$root}/data/contacts.json", $contacts);
        $this->addJson($zip, "{$root}/data/research-notes.json", $notes);
        $this->addJson($zip, "{$root}/data/team.json", $team);
        $this->addJson($zip, "{$root}/data/workspace.json", [
            'name' => $tenant->name,
            'public_id' => $tenant->public_id,
            'exported_at' => now()->toISOString(),
            'exported_by' => $export->requester?->email,
            'counts' => [
                'cases' => count($cases),
                'contacts' => count($contacts),
                'research_notes' => count($notes),
                'document_files' => $fileCount,
                'document_files_missing' => $missingFiles,
            ],
        ]);

        $this->addCsv($zip, "{$root}/csv/cases.csv", array_map(fn (array $c): array => collect($c)->except(['client', 'parties', 'team', 'hearings', 'diary_entries', 'documents'])->all(), $cases));
        $this->addCsv($zip, "{$root}/csv/hearings.csv", collect($cases)->flatMap(fn (array $c): array => $c['hearings'])->all());
        $this->addCsv($zip, "{$root}/csv/diary-entries.csv", collect($cases)->flatMap(fn (array $c): array => $c['diary_entries'])->all());
        $this->addCsv($zip, "{$root}/csv/documents.csv", collect($cases)->flatMap(fn (array $c): array => $c['documents'])->all());
        $this->addCsv($zip, "{$root}/csv/parties.csv", collect($cases)->flatMap(fn (array $c): array => $c['parties'])->all());
        $this->addCsv($zip, "{$root}/csv/contacts.csv", $contacts);

        $zip->addFromString("{$root}/README.txt", $this->readme((string) $tenant->name, $missingFiles));

        if (! $zip->close()) {
            throw new RuntimeException('Could not finish the export archive.');
        }

        $path = "exports/{$tenant->public_id}/{$export->public_id}.zip";
        $stream = fopen($localZip, 'rb');
        try {
            $disk->put($path, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
        $size = (int) filesize($localZip);
        unlink($localZip);

        return ['path' => $path, 'size' => $size];
    }

    /**
     * @return array{0: array<int, array<string, mixed>>, 1: int, 2: int}
     */
    private function exportCases(ZipArchive $zip, string $root, $disk): array
    {
        $cases = [];
        $fileCount = 0;
        $missingFiles = 0;

        CaseFile::query()
            ->with(['client', 'court', 'parties.client', 'participants.user', 'hearings', 'diaryEntries.hearing', 'documents.hearing'])
            ->orderBy('created_at')
            ->chunk(100, function ($chunk) use (&$cases, &$fileCount, &$missingFiles, $zip, $root, $disk): void {
                foreach ($chunk as $case) {
                    $folder = $this->uniquePath("{$root}/documents/".$this->safeName($case->title ?: $case->public_id));

                    $documents = [];
                    foreach ($case->documents as $document) {
                        $filePath = null;
                        if ($document->storage_key && $disk->exists($document->storage_key)) {
                            $filePath = $this->uniquePath("{$folder}/".$this->safeName($document->original_name ?: $document->public_id));
                            $zip->addFromString($filePath, (string) $disk->get($document->storage_key));
                            $fileCount++;
                        } else {
                            $missingFiles++;
                        }

                        $documents[] = $this->row($document) + [
                            'case_public_id' => $case->public_id,
                            'hearing_public_id' => $document->hearing?->public_id,
                            'file_in_export' => $filePath === null ? null : Str::after($filePath, "{$root}/"),
                        ];
                    }

                    $cases[] = $this->row($case) + [
                        // `court` is also a text column on cases; read the linked court explicitly.
                        'court_name' => $case->getRelationValue('court')?->name,
                        'client' => $case->client ? $this->row($case->client) : null,
                        'parties' => $case->parties->map(fn ($party): array => $this->row($party) + [
                            'case_public_id' => $case->public_id,
                            'client_public_id' => $party->client?->public_id,
                        ])->all(),
                        'team' => $case->participants->map(fn ($p): array => [
                            'name' => $p->user?->name,
                            'email' => $p->user?->email,
                            'role' => $p->role?->value,
                        ])->all(),
                        'hearings' => $case->hearings->map(fn ($h): array => $this->row($h) + ['case_public_id' => $case->public_id])->all(),
                        'diary_entries' => $case->diaryEntries->map(fn ($d): array => $this->row($d) + [
                            'case_public_id' => $case->public_id,
                            'hearing_public_id' => $d->hearing?->public_id,
                        ])->all(),
                        'documents' => $documents,
                    ];
                }
            });

        return [$cases, $fileCount, $missingFiles];
    }

    /**
     * A model's own columns without internal ids. Numeric foreign keys are
     * dropped; callers add the public ids of linked records.
     *
     * @return array<string, mixed>
     */
    private function row(Model $model): array
    {
        $data = $model->attributesToArray();
        foreach (array_keys($data) as $key) {
            if (in_array($key, self::WALL_CLOCK_KEYS, true)) {
                $data[$key] = WallClock::toJson($model->getAttribute($key));

                continue;
            }
            $isForeignKey = str_ends_with($key, '_id') && ! str_ends_with($key, 'public_id');
            if (in_array($key, self::INTERNAL_KEYS, true) || $isForeignKey || in_array($key, ['created_by', 'updated_by', 'uploaded_by'], true)) {
                unset($data[$key]);
            }
        }

        return $data;
    }

    private function addJson(ZipArchive $zip, string $path, array $data): void
    {
        $zip->addFromString($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function addCsv(ZipArchive $zip, string $path, array $rows): void
    {
        $columns = collect($rows)->flatMap(fn (array $row): array => array_keys($row))->unique()->values()->all();
        $handle = fopen('php://temp', 'r+');
        // UTF-8 BOM so Excel shows Bangla text correctly.
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $columns, escape: '');
        foreach ($rows as $row) {
            fputcsv($handle, array_map(function (string $column) use ($row): string {
                $value = $row[$column] ?? null;

                return is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string) ($value ?? '');
            }, $columns), escape: '');
        }
        rewind($handle);
        $zip->addFromString($path, (string) stream_get_contents($handle));
        fclose($handle);
    }

    private function safeName(string $name): string
    {
        // Keep Bangla and other letters; drop path separators and control characters.
        $clean = trim((string) preg_replace('/[\/\\\\:*?"<>|\x00-\x1F]+/u', '-', $name), " .-");

        return Str::limit($clean !== '' ? $clean : 'untitled', 120, '');
    }

    private function uniquePath(string $path): string
    {
        $candidate = $path;
        $info = pathinfo($path);
        $n = 2;
        while (isset($this->usedPaths[$candidate])) {
            $suffix = isset($info['extension']) ? " ({$n}).{$info['extension']}" : " ({$n})";
            $candidate = $info['dirname'].'/'.$info['filename'].$suffix;
            $n++;
        }
        $this->usedPaths[$candidate] = true;

        return $candidate;
    }

    private function readme(string $workspaceName, int $missingFiles): string
    {
        $lines = [
            "CaseDex export: {$workspaceName}",
            'Created '.now()->toDayDateTimeString().' (UTC)',
            '',
            'data/       Your records as JSON. cases.json holds each case with its client, parties,',
            '            team, hearings, diary entries and documents.',
            'csv/        The same records as spreadsheets (open in Excel or Google Sheets).',
            'documents/  Uploaded files, one folder per case. documents.csv maps each file to its case.',
            '',
            'Records are identified by public_id. Hearing and diary times are Bangladesh local time.',
        ];
        if ($missingFiles > 0) {
            $lines[] = '';
            $lines[] = "{$missingFiles} document file(s) could not be found in storage; their details are still in data/ and csv/.";
        }

        return implode("\n", $lines)."\n";
    }
}
