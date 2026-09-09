# Install the visual refresh — v0.9.1

This update adds a deep-green identity panel, warm neutral backgrounds, gold accents, drawn icons, balanced action cards, and primary navigation above the content on desktop. On phones the navigation stays at the bottom. All six home actions and existing routes remain.

The update keeps the original text sources, retrieval engine, ChatGPT handoff and Google settings. Fonts and icons are bundled/system-based: no external tracking, image or font requests were added. It retains keyboard focus, reduced-motion, high-contrast and screen-reader support. The hidden-state rule also ensures controls marked hidden stay hidden.

## Update your GitHub repository

1. Download and extract `local2912_visual_update_v0.9.1.zip`.
2. Open the extracted folder containing **public**, **tests**, **docs**, `package.json`, and `release.json`.
3. In GitHub Desktop choose **Repository → Show in Explorer**.
4. Copy the update folder's contents into that repository folder. Choose **Replace** when asked. Do not delete existing folders. Keep the folder structure: the update's `public` merges with your existing `public`.
5. Return to GitHub Desktop. In Summary enter **Refresh Member Hub design**. Click **Commit to main**, then **Push origin**.
6. On GitHub, open **Actions** and wait for **Publish Member Hub** to succeed.
7. Close all Member Hub browser tabs and installed-app windows. Open the site online, then close and reopen once more if the old design remains. The footer should show **v0.9.1**. The update waits for old windows to close so it can switch the offline cache safely.

The small update ZIP does not contain `js/config.js`, so your Google connection settings are preserved. Use the full package only for a new installation; it contains blank configuration defaults.

## Verification

The existing 78-question source retrieval regression remains at 100% Top-1/Top-3. Twelve integration checks pass. The design retains semantic links, labels and headings; decorative SVG icons are hidden from screen readers. Live device/screen-reader review remains part of the member pilot. This release was not deployed to your GitHub account by the assistant.
