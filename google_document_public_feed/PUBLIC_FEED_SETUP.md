# Local 2912 Document Source Public Feed - Setup

This is the read-only public side of Stage 8. Keep it in a separate Apps Script project from the restricted administrator app.

## Setup

1. Create a standalone Apps Script project named **Local 2912 Document Source Feed**.
2. Replace `Code.gs` with the supplied file.
3. In **Project Settings -> Script Properties**, add:
   - `PUBLISHED_FOLDER_ID` = the Published Source Snapshots folder ID shown by the restricted Document Administration app.
4. Deploy as a web app that executes as the source owner and is reachable by Member Hub users.
5. Copy the `/exec` deployment URL.
6. In the Member Hub `public/js/config.js`, set:

```js
integrations: {
  documentDataBaseUrl: "YOUR_PUBLIC_DOCUMENT_FEED_EXEC_URL"
}
```

## Read-only endpoints

The Member Hub requests only these feeds:

- `?feed=cbaCorpus`
- `?feed=personnelCorpus`
- `?feed=supplementsCorpus`
- `?feed=sourceManifest`
- `?feed=sourceArchive`

There is intentionally no `doPost`, upload, activation, or modification method in this public project.

## Fallback behavior

If the public document feed is not configured or is temporarily unavailable, the PWA continues using its bundled CBA and Personnel Rules. That fallback prevents an outage from removing critical rights information, but the production team should update the bundled fallback periodically after major source changes.
