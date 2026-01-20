Hello {{ $party->name }},

You have been added as a party on a case.

Case: {{ $case->title }}
Court: {{ $case->court ?? 'TBD' }}
Case number: {{ $case->case_number ?? 'Pending' }}

Added by: {{ $actor?->name ?? 'CaseDex team' }}

If this is unexpected, please contact the case team directly.
