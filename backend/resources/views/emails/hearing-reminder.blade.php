@extends('emails.layouts.base', ['subject' => __('emails.hearing_reminder_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hearing_reminder_intro') }}</p>
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_case') }}:</strong> {{ $notification->case?->title ?? __('emails.value_case') }}</p>
<p style="margin:0 0 16px;"><strong>{{ __('emails.label_hearing_time') }}:</strong> {{ \App\Support\LocalizedDate::dateTime($notification->hearing?->hearing_at) }}</p>
<p style="margin:0;color:#475569;">{{ __('emails.hearing_reminder_outro') }}</p>
@endsection
