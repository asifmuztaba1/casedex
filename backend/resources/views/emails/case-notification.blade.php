@extends('emails.layouts.base', ['subject' => $notification->title ?: __('emails.notification_subject_fallback')])

@section('content')
<p style="margin:0 0 12px;"><strong>{{ $notification->title }}</strong></p>
@if(!empty($notification->body))
<p style="margin:0 0 12px;">{{ $notification->body }}</p>
@endif
@if($notification->case)
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_case') }}:</strong> {{ $notification->case->title }}</p>
@endif
@if($notification->hearing)
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_hearing') }}:</strong> {{ \App\Support\LocalizedDate::dateTime($notification->hearing->hearing_at) }}</p>
@endif
@endsection
