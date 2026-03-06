@extends('emails.layouts.base', ['subject' => 'You were invited to a CaseDex workspace'])

@section('content')
<p style="margin:0 0 12px;">Hello {{ $user->name }},</p>
<p style="margin:0 0 12px;">You were added to a workspace team.</p>
<p style="margin:0 0 8px;"><strong>Temporary password:</strong> {{ $temporaryPassword }}</p>
<p style="margin:0 0 20px;">
  <a href="{{ $loginUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Sign in</a>
</p>
<p style="margin:0;color:#475569;">After first login, update your password from profile settings.</p>
@endsection
