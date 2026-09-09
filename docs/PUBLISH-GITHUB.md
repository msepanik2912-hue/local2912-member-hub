# Publish to members through GitHub Pages

1. Unzip the Stage 9 package. Open the folder containing `README.md`, `public`, and `.github`.
2. Sign in to GitHub with the Local's chosen owner account or organization. Create a repository named **local2912-member-hub**. A public repository supports Pages on GitHub Free. Review the PDFs and all files for approval to distribute.
3. Upload the **contents** of the extracted folder to the repository's `main` branch. Preserve the folder structure. Do not upload the ZIP itself or another enclosing folder. If your file picker omits hidden folders, create `.github/workflows/pages.yml` through **Add file → Create new file** and paste the supplied workflow exactly. GitHub Desktop can also publish the folder with `.github` included.
4. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**. The supplied workflow tests the package and publishes only `public/`. Do not select branch/root publishing for this layout.
5. Open **Actions → Publish Member Hub → Run workflow → main**. Wait for validate, build, and deploy to succeed. Open failed steps to see any errors.
6. Open **Settings → Pages → Visit site** or the completed deployment link. The usual address is `https://YOUR-OWNER.github.io/local2912-member-hub/`. Use the actual address GitHub displays, including the repository path.
7. Complete [the pilot checklist](RELEASE-CHECKLIST.md). Test signed out of GitHub, on a phone, and with the member's assistive technology. Check PDFs, search, Ask 2912, source labels, and Google feeds if configured.
8. Share the **GitHub Pages website address** by email, text, the Local's website, or a QR code pointing to that address. Do not send members to the repository. Create a GitHub Release tagged `v0.9.0` and attach the ZIP as a rollback reference.

Google setup can follow first publication: empty endpoint strings keep the app in labeled bundled fallback mode. Finish setup before describing calendar/directories as live.

## Installation and updates

Members can use the website directly. On iPhone/iPad, open in Safari and use Share → Add to Home Screen. On Android, use the browser's install/Add to Home screen option when offered. Labels vary by browser. Core information becomes available offline after a successful online load. PDFs must have been opened online to be cached; calendar/directory fallback data may be empty.

Commit updates to `main`; the workflow redeploys after validation. For each app release update `package.json`, `release.json`, `public/js/config.js`, the footer in `public/index.html`, and the cache version in `public/sw.js`. Close all Member Hub tabs and installed-app windows, then reopen so the waiting update can activate. See [rollback](VERSIONING-ROLLBACK.md).

For a blank site or missing styles, confirm `public/index.html`, the workflow's `path: public`, the Pages deployment status, and `/local2912-member-hub/` in the address. For stale content, close/reopen all app windows and check the footer version.

Official instructions checked September 9, 2026: [Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
