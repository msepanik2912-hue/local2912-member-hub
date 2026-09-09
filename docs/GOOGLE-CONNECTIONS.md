# Connect live Google data

All placeholders are in **`public/js/config.js`**. Leave endpoints as `""` until configured. Never paste a Sheet editing URL, private admin URL, token, or password here.

| Field | Public feed |
|---|---|
| `liveDataBaseUrl` | Shared calendar/board/stewards/resources/announcements service |
| `calendarFeedUrl` | Optional full override including `?feed=events` |
| `boardFeedUrl` | Optional override including `?feed=board` |
| `stewardFeedUrl` | Optional override including `?feed=stewards` |
| `resourcesFeedUrl` | Optional override including `?feed=resources` |
| `announcementsFeedUrl` | Optional override including `?feed=announcements` |
| `documentDataBaseUrl` | Separate read-only document service |

Base endpoints end in `/exec`; the app appends `feed`. Individual overrides are complete HTTPS JSON URLs. Usually only the two base fields need values. That initial configuration requires a GitHub commit; ordinary content updates then happen in Google without app edits.

## Member information

Follow [Google data setup](../google_admin_backend/GOOGLE_ADMIN_SETUP.md) using Stage 9's `Code.gs` and the exact Sheet headers. Stage 9 maps Board/Stewards headers into the field names the app expects and returns only allowed public fields. Even `Notes` is public: never include case notes. Only published, non-inactive rows are returned.

Use a dedicated public-member calendar, enter its ID in Settings, and give the script owner access. Set the Sheet, Calendar and Apps Script time zones to America/Chicago. Verify all-day and daylight-saving event display during the pilot.

Deploy the data script as a web app executing as the owner, permitting anonymous reads where Google policy allows. Use only approved public data. Copy the production `/exec` URL to `liveDataBaseUrl`. Test all five feeds signed out, then in the actual Pages site.

## Documents

1. Follow [restricted admin setup](../google_document_admin/ADMIN_SETUP.md). Set required `ADMIN_EMAILS` before setup. Stage 9 denies empty allowlists and unidentified callers. Execute as the accessing user and keep deployment restricted. Authorized officers need registry/folder access. Never put this URL in the app.
2. Upload the CBA and Personnel Rules PDFs from `public/docs/`, entering verified effective/revision dates. Analyze, review text and tables, save drafts, compare, and activate after review. The registry is **not** pre-seeded by this ZIP.
3. Follow [public feed setup](../google_document_public_feed/PUBLIC_FEED_SETUP.md) in a separate Apps Script project. Set `PUBLISHED_FOLDER_ID` to the admin's Published Source Snapshots folder. Deploy as the owner with anonymous reads for public material where policy permits. Put this `/exec` URL in `documentDataBaseUrl`.
4. Verify `?feed=cbaCorpus`, `personnelCorpus`, `supplementsCorpus`, `sourceManifest`, and `sourceArchive` return JSON, not sign-in/error pages. Check official PDF links signed out.
5. Reopen the app after activation. Verify Source Versions and excerpts before notifying members. The inherited publisher writes separate snapshot files, not an atomic transaction: avoid activation during a pilot test. If any source request fails, Stage 9 falls back to the complete bundled set rather than mixing live and bundled sources.

Stage 8 schemas are retained (`metadata`/`records`, manifest `sources`, archive `items`). No schema migration is required. Upload, analyze, compare, draft, activation, archives and rollback remain in the restricted app.

## Failure and recovery

Live reads time out after 10 seconds and send no credentials or member question. The service worker does not cache Google responses. Malformed/error feeds fall back to local data. Empty directories show Not connected; source text shows Bundled fallback. Reachable old data has no freshness guarantee. Refresh the bundled copies after reviewed document changes, preserving archives.

Test Google redirects and cross-origin reads from the actual Pages site. **GitHub Pages cannot run a server-side proxy.** If reads are blocked, retain fallback mode and publish approved static JSON snapshots, or separately provision a read-only HTTPS service with appropriate cross-origin headers. That service is not included. Do not use `no-cors` or JSONP to hide failure. Static snapshots require a refresh process and are not an automatic Google connection.

References: [Google web apps](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content).
