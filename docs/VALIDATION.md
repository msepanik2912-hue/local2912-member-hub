# Stage 9 changes and validation

This release integrates the actual user-supplied Stage 8 ZIP. Original PDFs, source corpora, retrieval hints and 78-question set are retained. `release.json` records the input ZIP hash.

## Changes

- Repository separates `public/` from tools, operator guides and Google backend source. Pages workflow validates and uploads only `public/`.
- PWA identity is relative to the repository path; offline cache cleanup is scoped to that path. Google responses bypass the worker, avoiding cached responses labeled as live. Updates wait for existing app windows to close.
- Live requests have a 10-second timeout and omit credentials/referrers; malformed/error feeds use fallback. If only part of the document set loads live, the whole set falls back to the matching bundle.
- Public Board/Stewards feed maps Google Sheet headers to app field names and restricts output to approved schema columns.
- Restricted admin requires a nonempty allowlist and identifiable active caller; it no longer substitutes the script owner's identity for an unidentified user.
- Existing CBA-first retrieval, prompt review/edit/copy, manual member-owned ChatGPT handoff, source versions, HTML reader and accessibility structure are retained.

## Checks

`python tools/validate_build.py`: passed against Stage 9, including critical source passages, 239 CBA records, 152 Personnel Rules records, no-API architecture, separate public/read-only feeds and original retrieval regression. The 78 supplied questions achieved **100% Top-1 and 100% Top-3** in the inherited Python retrieval evaluator. This is a fixed regression set, not a guarantee for every question or an end-to-end browser evaluation.

`npm test`: tests Stage 9 transport failures, configuration, source shapes, path-specific cache behavior, public directory field mapping and admin caller checks using local mocks. These do not contact Google.

JavaScript syntax and public asset paths were checked. Final package comparison records preserved/changed files in `reports/stage9-file-comparison.json`.

## Remaining operational validation

No actual GitHub deployment, live Google account connection, screen-reader/device session, or member pilot has been performed. Follow the pilot checklist before broad distribution.

Stage 8's document extraction still requires human review of scans, tables and changed provisions. The five Google source snapshots are not an atomic publication transaction. Archive metadata is preserved, but the current local search is not a full historical-corpus search. No new historical search capability or automated extraction accuracy claim is made in Stage 9.
