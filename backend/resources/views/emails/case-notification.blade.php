@extends('emails.layouts.base', ['subject' => $notification->title ?: 'CaseDex notification'])

@section('content')
<p style="margin:0 0 12px;"><strong>{{ $notification->title }}</strong></p>
@if(!empty($notification->body))
<p style="margin:0 0 12px;">{{ $notification->body }}</p>
@endif
@if($notification->case)
<p style="margin:0 0 6px;"><strong>Case:</strong> {{ $notification->case->title }}</p>
@endif
@if($notification->hearing)
<p style="margin:0 0 6px;"><strong>Hearing:</strong> {{ $notification->hearing->hearing_at }}</p>
@endif
<p style="margin:0;color:#475569;">Notification type: {{ $notification->notification_type }}</p>
@endsection
