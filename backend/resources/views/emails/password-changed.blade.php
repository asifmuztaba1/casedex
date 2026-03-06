@extends('emails.layouts.base', ['subject' => 'Your CaseDex password was updated'])

@section('content')
<p style="margin:0 0 12px;">Hello {{ $user->name }},</p>
<p style="margin:0 0 12px;">Your password was changed successfully.</p>
<p style="margin:0 0 8px;"><strong>Time:</strong> {{ $changedAt }}</p>
<p style="margin:0 0 16px;"><strong>IP address:</strong> {{ $ipAddress }}</p>
<p style="margin:0;color:#475569;">If you did not perform this action, reset your password immediately.</p>
@endsection
