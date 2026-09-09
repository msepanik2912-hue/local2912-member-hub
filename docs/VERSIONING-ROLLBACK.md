# Versioning and rollback

App releases and document versions are independent. A GitHub rollback does not undo Google activation; document reactivation does not redeploy Pages.

Use `v0.9.0` for this pilot and increment patch versions for fixes. Create a GitHub Release at the tested `main` commit, attach its ZIP, and record the Pages URL, source versions, and test results. Keep the original Stage 8 ZIP. Record document activations in the registry.

## App rollback

Revert the faulty commits through a pull request and merge to `main`. Alternatively restore the last known-good Release ZIP in a branch, reviewing removal of files introduced by the failed release. Creating an old tag alone does not change the live site.

Release the restoration as a new patch: increment the service-worker cache version and visible version even if restoring older code. Keep reviewed endpoint settings unless they caused the issue. Run checks, merge, and verify the Pages deployment. Close every Member Hub browser tab and installed-app window; reopen online, confirm the footer and test search/offline behavior. Clearing this site's browser storage is a last resort and requires a new online load.

Do not force-push or erase release history. Do not restore the Stage 8 worker's origin-wide cache deletion: Stage 9 scopes cleanup to this site's path.

## Document rollback

In restricted Document Administration, select the archived version and use rollback/reactivation after reviewing validation and dates. The prior active full CBA or Rules becomes archived; supplements are managed separately. Confirm all five snapshot feeds, reopen the app, and verify Source Versions and excerpts. Preserve PDFs, text, metadata, and history.

Maintain restricted backups of the registry, original PDFs and published snapshots before major changes. GitHub rollback cannot recover a deleted Drive file. For historical questions explicitly identify the applicable archived version/date; archive listings do not mean the current-source search retrieves archived full text. Obtain steward review of historical applicability.
