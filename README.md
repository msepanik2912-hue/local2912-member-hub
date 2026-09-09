# AFSCME Local 2912 Member Hub — Stage 9

Complete pilot build, **v0.9.0**, based on the supplied Stage 8 ZIP. Its SHA-256 is recorded in `release.json`.

Start with [Publish through GitHub Pages](docs/PUBLISH-GITHUB.md). Members receive the website address, not the repository address.

Included: the Stage 8 app, official bundled CBA and Personnel Rules PDFs, HTML search/reader, accessibility features, source versions, member-owned ChatGPT handoff, and separate no-code Google document administration. Stage 9 adds GitHub Pages publishing, scoped offline caches, feed fixes, connection placeholders and release guidance.

## Repository structure

- `public/`: member website, source PDFs and bundled data; only this folder is deployed to Pages.
- `public/js/config.js`: blank live Google endpoint placeholders.
- `.github/workflows/pages.yml`: validation and deployment.
- `google_admin_backend/`: read-only calendar/board/stewards/resources/announcements feed.
- `google_document_admin/`: restricted document administration source and setup.
- `google_document_public_feed/`: separate read-only source feed.
- `docs/`: Stage 9 operator guides.
- `tools/`, `tests/`, `reports/`: validation and retrieval evidence.

Run `npm test` and `python tools/validate_build.py` from this folder (Node 22+, Python 3; no dependencies or API keys). Local preview: `python -m http.server 8000 --directory public`, then open `http://localhost:8000/`.

Google endpoints remain blank; no Google or GitHub account was configured during packaging. The app works in labeled bundled fallback mode. Screen-reader/device testing and the member pilot remain release tasks.

Read [Google connections](docs/GOOGLE-CONNECTIONS.md), [pilot checklist](docs/RELEASE-CHECKLIST.md), [rollback](docs/VERSIONING-ROLLBACK.md), and [validation](docs/VALIDATION.md). Prior stage notes are historical; Stage 9 instructions govern changed paths and setup.

GitHub Pages is public in this setup. A public repository exposes all committed files, including files outside `public/`. Never commit actual administrator settings, credentials, private contacts or case information. Backend source templates contain no account credentials and are outside the deployed website.
