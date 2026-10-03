# Bangla legal terms: review sheet

For the native Bangla reviewer. These are the legal terms the app shows in
Bangla: party roles, hearing types, document types and case statuses. The
wording a lawyer sees in court documents matters more here than anywhere else
in the app.

For each row, mark **OK**, or write the term Bangladeshi courts actually use.
The "Concern" column is a suggestion to check, not a decision.

The keys are in `frontend/lib/i18n.ts` (the `bn` dictionary). Every other
Bangla string in the app also needs a read-through, but these come first.

## Party roles (case parties)

| Key | English | Current Bangla | Concern | Reviewer |
|---|---|---|---|---|
| `party.role.defendant`, `roles.defendant` | Defendant | আসামী | আসামী is the accused in a **criminal** case. A civil defendant is usually **বিবাদী**. | |
| `party.role.accused`, `roles.accused` | Accused | অভিযুক্ত | Courts and FIRs usually say **আসামী**. Should Accused take আসামী once Defendant becomes বিবাদী? | |
| `party.role.respondent`, `roles.respondent` | Respondent | উত্তরদাতা | Writs, appeals and revisions usually use **প্রতিবাদী** (or রেসপনডেন্ট). | |
| `party.role.petitioner`, `roles.petitioner` | Petitioner | আবেদনকারী | Same word as Applicant, so the two roles can't be told apart. **দরখাস্তকারী** for Petitioner? | |
| `party.role.applicant`, `roles.applicant` | Applicant | আবেদনকারী | See Petitioner. | |
| `party.role.state`, `roles.state` | State | স্টেইট | Criminal cases are titled **রাষ্ট্র** বনাম …, so স্টেইট looks wrong. | |
| `party.role.plaintiff`, `roles.plaintiff` | Plaintiff | বাদী | Looks right. | |
| `party.role.appellant`, `roles.appellant` | Appellant | আপিলকারী | Looks right. | |
| `party.role.claimant`, `roles.claimant` | Claimant | দাবিদার | OK, or দাবিকারী? | |
| `party.side.opponent` | Opponent | প্রতিপক্ষ | Looks right. | |
| `party.side.client` | Client side | ক্লায়েন্ট পক্ষ | OK, or মক্কেল পক্ষ? | |

## Team roles

| Key | English | Current Bangla | Concern | Reviewer |
|---|---|---|---|---|
| `roles.lawyer` | Lawyer | উকিল | "Lead lawyer" uses আইনজীবী. Use **আইনজীবী** for both, for consistency? | |
| `roles.lead_lawyer` | Lead lawyer | প্রধান আইনজীবী | Looks right. | |
| `roles.associate` | Associate | সহযোগী | OK, or জুনিয়র আইনজীবী? | |

## Hearing types

| Key | English | Current Bangla | Concern | Reviewer |
|---|---|---|---|---|
| `hearing.type.mention` | Mention | উল্লেখ | A literal translation. Lawyers usually say **মেনশন**. | |
| `hearing.type.order` | Order | অর্ডার | The court term is **আদেশ**. | |
| `hearing.type.trial` | Trial | বিচার | OK, or সাক্ষ্যগ্রহণ for evidence days? | |
| `hearing.type.hearing` | Hearing | শুনানি | Looks right. | |

## Document types

| Key | English | Current Bangla | Concern | Reviewer |
|---|---|---|---|---|
| `document.category.order_sheet` | Order sheet | অর্ডার শীট | The standard term is **আদেশনামা**. | |
| `document.category.evidence` | Evidence | প্রমাণ | Legal evidence is usually **সাক্ষ্য**. | |
| `document.category.petition` | Petition | পিটিশন | OK, or **দরখাস্ত**/আরজি (civil plaint)? | |

## Case status

| Key | English | Current Bangla | Concern | Reviewer |
|---|---|---|---|---|
| `case.status.open`, `status.open` | Open | খোলা | For a case, **চলমান** may read better than খোলা. | |
| `case.status.closed`, `status.closed` | Closed | বন্ধ | Courts say **নিষ্পন্ন** (disposed) for a finished case. | |
| `case.status.active` | Active | সক্রিয় | Looks right. | |
| `case.status.archived` | Archived | সংরক্ষণাগারভুক্ত | OK. | |

## Already checked automatically

- All 1,854 keys exist in both English and Bangla, with no missing or extra keys.
- The only Bangla values identical to English are brand names (CaseDex, Sentry,
  Android, iPhone), which is correct.
- No English sentences are hard-coded in the interface. A test in CI
  (`frontend/tests/security/i18n-coverage.test.ts`) keeps it that way.
