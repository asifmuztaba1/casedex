<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class TranscribeDictationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxSeconds = (int) config('billing.ai.voice.dictation_max_seconds', 180);

        return [
            // Browsers record webm/ogg (Chrome, Firefox) or mp4 (Safari).
            'audio' => ['required', 'file', 'max:10240', 'mimetypes:audio/webm,video/webm,audio/ogg,audio/mp4,video/mp4,audio/mpeg,audio/wav,audio/x-wav,audio/aac'],
            'duration_seconds' => ['required', 'integer', 'min:1', "max:{$maxSeconds}"],
            // Leave out to let Scribe detect Bangla, English or a mix.
            'language' => ['nullable', 'string', 'in:bn,en'],
        ];
    }
}
