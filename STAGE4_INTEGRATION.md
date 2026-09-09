# Stage 4 Integration Plan

Stage 3 proves the app shell and accessibility interaction model. Stage 4 should connect authoritative content without turning the member app into a confidential case system.

## 1. Google Calendar

Recommended architecture:

Google Calendar (Board-managed) -> read-only bridge/API -> accessible JSON -> Member Hub list

Why not rely only on an embedded month calendar:
- list views are easier on phones and screen readers;
- the app can filter categories cleanly;
- officers continue updating Google Calendar without editing app code.

Suggested event schema:

```json
{
  "id": "event-id",
  "title": "Membership Meeting",
  "start": "2026-09-22T17:30:00-05:00",
  "end": "2026-09-22T19:00:00-05:00",
  "location": "...",
  "description": "...",
  "category": "Membership Meeting"
}
```

## 2. Board / resources

Stage 3 uses local JSON. Production can replace this with a read-only endpoint backed by an officer-maintained Google Sheet.

Only approved member-facing fields should be exposed. Internal steward/case data stays separate.

## 3. CBA ingestion

Do not connect Ask 2912 first.

First build an authoritative contract corpus containing:
- Article
- Section
- subsection where applicable
- exact official text
- page/source reference
- plain-language topic tags
- version/effective-date metadata

The search UI must always distinguish official contract text from explanatory material.

## 4. Ask 2912

Pipeline:

Member question -> issue classification -> approved-source retrieval -> answer generation -> cited Article/Section -> steward referral rules

Hard rules:
- no uncited contract conclusions;
- no definitive ruling that management violated the contract;
- no definitive grievance deadline calculation;
- elevated steward referral for discipline, termination, suspension, investigation, retaliation, discrimination, accommodation, pay shortage and other high-risk issues;
- asking the bot never counts as notifying the union.

## 5. Privacy

Version 1 should remain public/no-login unless a later feature genuinely requires authentication.

Do not store grievance files, medical records, disciplinary evidence or confidential case notes in the member hub. If formal case intake is added later, treat it as a separate secured system with its own retention, access and encryption design.

## 6. Rights-content legal review

Before public release, have Local/Council representatives review the Weingarten, grievance-deadline and discipline guidance. Local 2912 members are Illinois municipal public employees, so public-sector guidance should be tied to the Illinois Public Labor Relations Act, applicable CBA language and Illinois Labor Relations Board precedent.
