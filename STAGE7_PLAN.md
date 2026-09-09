# Stage 7 — Live Union Information Integrations

Status: **implemented in this package**.

Completed architecture:
1. Google Calendar read-only feed for membership meetings, trainings, events and important dates.
2. Board directory data source for approved public profiles and contacts.
3. Public-facing steward routing by department, separated from grievance and internal steward-management records.
4. Announcements/resources feeds authorized officers can maintain without editing app code.
5. Offline/bundled fallback and accessibility-first rendering.

Actual Local data is intentionally not fabricated. Connect the dedicated Google Sheet/Calendar using `google_admin_backend/GOOGLE_ADMIN_SETUP.md`.
