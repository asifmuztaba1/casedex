@extends('emails.layouts.base', ['subject' => 'You were added to a case'])

@section('content')
<p style="margin:0 0 12px;">Hello {{ $party->name }},</p>
<p style="margin:0 0 12px;">You were added as a party on a case.</p>
<p style="margin:0 0 6px;"><strong>Case:</strong> {{ $case->title }}</p>
<p style="margin:0 0 6px;"><strong>Court:</strong> {{ $case->court ?? 'TBD' }}</p>
<p style="margin:0 0 6px;"><strong>Case number:</strong> {{ $case->case_number ?? 'Pending' }}</p>
<p style="margin:0 0 16px;"><strong>Added by:</strong> {{ $actor?->name ?? 'CaseDex team' }}</p>
<p style="margin:0;color:#475569;">If this is unexpected, contact your case team.</p>
@endsection
