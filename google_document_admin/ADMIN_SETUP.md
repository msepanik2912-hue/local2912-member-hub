# Local 2912 Document Administration - Setup

This is the restricted administrator side of the Stage 8 no-code source update system. It is deliberately separate from the public member-data feed.

## 1. Create the admin Apps Script project

1. Go to `script.google.com` while signed in to the Google account that will own Local 2912 union materials.
2. Create a new standalone project named **Local 2912 Document Administration**.
3. Replace `Code.gs` with the provided `Code.gs`.
4. Add a new HTML file named `DocumentAdmin` and paste in `DocumentAdmin.html`.
5. In **Project Settings -> Script Properties**, add `ADMIN_EMAILS` with a comma-separated list of authorized administrator Google-account email addresses. This allowlist is required in Stage 9. An empty list or unidentified caller is denied. Configure it before setup.
6. Run `setupDocumentAdmin()` once from the Apps Script editor and approve Google Drive/Sheets permissions. It creates:
   - a Document Registry spreadsheet,
   - a private Source Documents folder,
   - a Published Source Snapshots folder.

## 2. Deploy the ADMIN web app

Deploy this project as a web app for authorized administrators only, executing as the user accessing the app. Grant those administrators access to the registry and source folders. Test with both an allowed and a disallowed account; unidentified callers are denied. Do **not** choose anonymous/public access for the admin deployment. Restrict access to the administrators who will maintain the CBA and Personnel Rules.

The public Member Hub must never use this admin deployment URL.

## 3. Upload workflow

An administrator can then:

1. Choose CBA, Personnel Rules, or supplemental agreement.
2. Fill effective/revision metadata.
3. Select the PDF.
4. Choose **Analyze PDF**.
5. Review extraction/validation warnings and detected headings.
6. Save it as a draft.
7. Compare it with the currently active version.
8. Activate it only after review.

Activation automatically archives the prior full CBA or Personnel Rules version and rebuilds read-only public JSON snapshots. Previous versions remain in the registry and Drive for rollback/historical questions.

## 4. Supplemental agreements

For MOUs, side letters, amendments, and extensions, enter the exact CBA Articles/Sections affected and a short statement describing how the document expressly modifies or supplements the agreement. Do not infer a conflict merely because documents address similar subjects.

Multiple supplemental agreements may be active simultaneously. The Member Hub displays them as conditional sources rather than automatically treating every supplemental document as controlling over the full CBA.

## 5. Accessibility / extraction rule

The browser extracts text from the PDF with PDF.js. Image-only/scanned pages are flagged. Do not activate a source that would make critical material available only as an inaccessible image. Provide verified accessible text for image-based pages before production use.

Complex tables (salary schedules, appendices, matrices) still require manual accessibility review even when text extraction succeeds.

## 6. Public PDF sharing

The admin tool attempts to make an activated source PDF viewable with a link. Google-account or organization policy can block that action. If the tool reports a sharing warning, manually make the official PDF view-only to the intended member audience before relying on its link in the Member Hub.

## 7. Connect the public feed

The admin screen shows the **Published Source Snapshots folder ID**. Use that ID as `PUBLISHED_FOLDER_ID` in the separate `google_document_public_feed` project. See its setup instructions.
