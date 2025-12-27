Hearing reminder

A hearing is scheduled for tomorrow.

Case: {{ $notification->case?->title ?? 'Case' }}
Hearing time: {{ optional($notification->hearing)->hearing_at }}

This is an automated reminder from your case workspace.
