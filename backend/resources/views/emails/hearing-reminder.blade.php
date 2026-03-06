@extends('emails.layouts.base', ['subject' => 'Hearing reminder'])

@section('content')
<p style="margin:0 0 12px;">A hearing is scheduled for tomorrow.</p>
<p style="margin:0 0 6px;"><strong>Case:</strong> {{ $notification->case?->title ?? 'Case' }}</p>
<p style="margin:0 0 16px;"><strong>Hearing time:</strong> {{ optional($notification->hearing)->hearing_at }}</p>
<p style="margin:0;color:#475569;">Review hearing notes and required next steps before session time.</p>
@endsection
