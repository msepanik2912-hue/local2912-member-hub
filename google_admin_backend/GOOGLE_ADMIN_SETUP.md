# Google Admin Data Setup — Local 2912 Member Hub

Stage 7 is designed so authorized Local 2912 officers can maintain public member information without editing the app.

## 1. Create a dedicated Google Sheet

Use a Sheet intended **only for information approved for display in the member-facing app**. Do not place grievance data, member case notes, medical information, internal steward notes, SSNs, or confidential union records in it.

Create these tabs with the exact header names below.

### Settings
`Key | Value`

Recommended rows:
- `Calendar ID | <ID of dedicated Local 2912 public/member calendar>`
- `Calendar Days Ahead | 180`

### Board
`Publish | Active | Sort | Name | Office | Summary | Email | Phone | PhotoUrl | PhotoAlt`

Only rows with `Publish = TRUE` are returned to the app. Set `Active = FALSE` to immediately remove a profile without deleting the row.

### Stewards
`Publish | Active | Sort | Department | Name | Role | WorkLocation | Email | Phone | Notes`

This tab is **public-facing routing only**. It should contain only contacts Local 2912 has approved members to see. It must not mirror confidential grievance or steward case-tracking fields.

### Resources
`Publish | Active | Sort | Group | Label | Href | Description`

Examples of Group values: `Know your union`, `Know your rights`, `Get involved`.

### Announcements
`Publish | Active | Title | Summary | Href | LinkLabel | PublishDate | Expires`

Use expiration dates for temporary notices so old information automatically disappears.

## 2. Create a dedicated Google Calendar

Create a calendar specifically for member-facing Local 2912 dates. Board members with permission can add or edit events normally in Google Calendar. The app receives only title, start/end time, location, and description.

Do not put private grievance meetings, member case appointments, or confidential board matters on this calendar.

## 3. Add the Apps Script

In the Google Sheet choose **Extensions → Apps Script**. Replace the starter code with `Code.gs` from this folder.

Deploy it as a **Web app** that executes as the Sheet owner and can be accessed by the audience required for the Member Hub. The endpoint is read-only because the script implements only `doGet`; it has no write endpoint.

## 4. Connect the PWA

Copy the Web App deployment URL into `public/js/config.js`:

`liveDataBaseUrl: "YOUR_APPS_SCRIPT_WEB_APP_URL"`

The app automatically requests:
- `?feed=events`
- `?feed=board`
- `?feed=stewards`
- `?feed=resources`
- `?feed=announcements`

If the Google endpoint is unavailable, the PWA falls back to its bundled local JSON data and labels the source accordingly.

## 5. Accessibility / publishing checks

Before publishing a Board photo, provide meaningful `PhotoAlt` text. Links should have descriptive labels. Calendar descriptions and announcements should not rely only on emoji, color, images, or audio to convey meaning.

For linked video/audio resources, the media itself must meet the Local 2912 caption/transcript/ASL requirements documented in `ACCESSIBILITY.md`.

## Browser/hosting verification

Before production, test from the actual GitHub Pages site on desktop and mobile. Google redirects and cross-origin behavior can vary. GitHub Pages cannot run a server-side proxy. If direct reads fail, keep the labeled bundled fallback and publish approved static JSON snapshots, or separately provision a read-only HTTPS service with appropriate cross-origin headers. A separate service is not included. See `docs/GOOGLE-CONNECTIONS.md` for Stage 9 limitations and setup.
