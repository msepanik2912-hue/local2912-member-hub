# Stage 7 Implementation — Live Union Information

Stage 7 adds a no-code public information layer around the existing accessible Member Hub.

## Implemented

- Optional Google Apps Script endpoint for live Local-controlled public data.
- Dedicated Google Calendar feed presented as an accessible upcoming-events list.
- Board directory feed with approved photo/contact fields.
- Public-facing steward routing by department, kept separate from grievance and internal steward systems.
- Resources feed.
- Expiring announcements feed for the home screen.
- Automatic bundled-data fallback if the live service is unavailable.
- Visible source-status labels (`Live`, `Bundled fallback`, `Not connected`).
- Device-calendar `.ics` downloads and Google Calendar handoff for events.
- No member authentication or confidential member data added in this stage.

## Security boundary

The Google Sheet and Calendar used by this endpoint are publication sources, not union case-management stores. Publishing controls are intentionally explicit (`Publish = TRUE`) to reduce accidental exposure.

## Contract and Personnel Rules maintenance

The future no-code document administrator remains a required separate workflow. It must support upload, version metadata, validation, activation, archive/rollback, amendments/MOUs/side letters, and the permanent CBA-over-Personnel-Rules precedence rule. This is not replaced by the public Sheet feed.
