# Source Governance - Local 2912 Member Hub

## Current bundled fallback sources

### Primary
**AFSCME-City of Chicago Collective Bargaining Agreement**
- Term: July 1, 2022-June 30, 2027
- Role: primary full agreement for represented members.

### Supplemental
**City of Chicago Personnel Rules**
- Revision: August 1, 2025
- Role: supplemental City rules and procedures where relevant.

These bundled files are the offline/failure fallback until the live Stage 8 document feed is connected. Once connected, the Member Hub identifies the active live version used.

## Source precedence

For represented Local 2912 employees:

1. An active MOU, amendment, side letter, or extension may modify/supplement CBA language only to the extent the supplemental document expressly says so.
2. The active CBA is the primary full agreement.
3. Personnel Rules are supplemental. Where an applicable CBA conflicts with Personnel Rules, the CBA governs.

The app must never infer that a supplemental agreement silently supersedes unrelated CBA language.

## Version lifecycle

Full CBA and Personnel Rules sources use:

**Draft -> Validate/Review -> Active -> Archived**

Activation of a new full source automatically archives the previously active source of the same type. Historical versions are preserved rather than overwritten and may be reactivated for rollback.

## Historical questions

The default search corpus is the current active source set. Archived documents exist for historical questions and governance/rollback, but the app should not automatically decide which historical agreement applies to a workplace event without sufficient date/context information. Refer uncertain historical applicability to a steward.

## Supplemental agreements

Each supplemental source must include:
- title;
- effective dates where known;
- status;
- affected CBA Article(s)/Section(s) where known;
- a short administrator-entered statement describing the express modification/supplement.

Multiple supplemental sources may be active at one time.

## Separation of duties

### Restricted administrator project
May write to Drive/Sheets, upload, validate, activate, archive and republish source snapshots.

### Public document feed
Read-only. It serves only activated source snapshots. It must not contain upload, activation or other mutation endpoints.

### Member Hub
Read-only consumer of source content. If the live feed fails, it uses bundled fallback documents.

## Grievance routing

The negotiated grievance/arbitration procedure in the applicable CBA must not be merged with the general Personnel Rules grievance process into one timeline.

## Discipline / representation

The applicable CBA is the primary negotiated source for discipline/predisciplinary procedure and contractual Union-representation rights. Ask 2912 must not substitute a general Personnel Rules appeal process for negotiated CBA procedures.

## Ask 2912 governance

Ask 2912 must:
- retrieve approved source text before preparing the ChatGPT handoff;
- identify whether a source is CBA, conditional supplemental agreement, or Personnel Rules;
- preserve source/version metadata;
- never invent Article numbers, deadlines or source language;
- never declare conclusively that a grievance exists or that the City violated the agreement;
- never treat use of the app/ChatGPT as notice to the Union;
- route time-sensitive/fact-specific issues to a steward;
- use no Local-funded OpenAI API key or tokens.

## Accessibility and source activation

Image-only/scanned pages are publication warnings. Complex schedules/tables require semantic accessibility review. Source activation must not make critical union information available only through an inaccessible PDF/image.
