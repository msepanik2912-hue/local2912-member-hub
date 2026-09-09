# Stage 8 Implementation - No-Code Source Administration

## Implemented

- Separate restricted document-administration Apps Script project.
- Separate read-only public source-feed Apps Script project.
- Browser PDF text extraction/structural parsing using PDF.js in the admin interface.
- Draft -> validate/review -> activate lifecycle.
- Automatic archival of the previously active full CBA or Personnel Rules version.
- Rollback/activation of preserved historical versions.
- Source metadata including effective/revision dates and status.
- Supplemental agreement support for MOUs, side letters, amendments and extensions.
- Supplemental `affects` and precedence-note metadata.
- Heading-level comparison against the active same-type source.
- Read-only published JSON snapshots in Google Drive.
- Dynamic Member Hub loading of live document sources with bundled offline fallback.
- Public Source Versions page.
- No change to the Stage 6 member-owned ChatGPT architecture.

## Validation philosophy

The importer does not assume successful text extraction means the document is safe to publish. It checks structural and critical-topic signals and flags image-only pages. A human administrator must still review the imported document before activation.

A new contract can legitimately change Article numbers or wording, so Stage 8 does not automatically reject a future CBA merely because it differs from the 2022-2027 regression expectations. Instead, it reports changed headings and checks whether critical subject areas remain discoverable.

## Important deployment separation

The restricted admin app and the public source feed must remain separate Apps Script deployments/projects. The public source feed has no `doPost` or administrative function. Do not merge the upload/activation functions into the member-facing endpoint.

## Production limitation still to address

The Member Hub bundle contains the current source set for offline/fallback use. After a future CBA or Personnel Rules version is activated, the live feed updates immediately, but the bundled offline fallback should also be refreshed as part of a planned release process. Stage 9 should automate or operationalize that fallback refresh/deployment step.
