# Accessibility Standard — Local 2912 Member Hub

Accessibility is a release criterion, not a post-build enhancement. WCAG 2.2 AA is the minimum technical baseline, with additional usability requirements for blind, low-vision, Deaf and hard-of-hearing members.

## Core rule

Critical Local 2912 information must not depend solely on sight or solely on hearing.

A feature is not considered complete merely because automated testing passes. Core tasks must also be usable with assistive technology.

## Blind / low-vision / nonvisual access

- Semantic HTML landmarks and real heading structure.
- Keyboard-operable controls with visible focus indicators.
- Skip-to-main-content link.
- Screen-reader status announcements for dynamic actions.
- Do not stream chatbot output word-by-word to live regions; announce status and completion instead.
- Accessible text alternatives to PDF-only content.
- Strong contrast, 200%/400% zoom and responsive reflow.
- Support high-contrast/forced-color environments.
- Support reduced motion.
- Do not rely on icons, color or position alone to communicate meaning.

### Source reader

Stage 5 provides searchable HTML text extracted from the official PDFs. Each result links to the official PDF page for verification.

Some CBA appendices/salary schedules use complex tabular layouts. Stage 5 flags these pages because plain extracted text is not equivalent to a semantic HTML table. Before final release, frequently used salary and schedule tables should be converted to properly structured tables with headers, captions and screen-reader testing.

The Personnel Rules source also includes an image-based FMLA poster. The image must not be the only accessible presentation of that information. A verified text alternative/current accessible source should be supplied before relying on it in production.

## Deaf / hard-of-hearing access

- Every video requires accurate closed captions.
- Every video and audio item requires a complete transcript.
- Automated captions must be human-reviewed before publication, especially names, acronyms, department names, contract terms and labor terminology.
- Key rights/training material should support an ASL-interpreted version or interpreter inset where feasible.
- ASL supplements captions; it does not replace them.
- Interpreter windows must be large enough to read signing and must not cover material content.
- Relevant audio-only information must also be represented visually/textually.
- Alerts must never depend on sound alone.
- Live streamed meetings/trainings should support live captions/CART and, where appropriate, ASL interpretation.

## Media controls

Where available, media should expose clear controls/links for:
- Captions (CC)
- Transcript
- ASL

## Forms

- Every input has an explicit programmatic label.
- Required state and errors are communicated in text and programmatically, not color alone.
- Error summaries should identify each problem and move/announce focus appropriately.
- Touch targets should be at least 44×44 CSS pixels where practical.

## Testing matrix

### Windows
- NVDA + Chrome
- NVDA + Edge
- Keyboard only
- Windows High Contrast / forced colors
- JAWS where available

### Apple
- VoiceOver + Safari on iPhone/iPad
- VoiceOver + Safari on macOS

### Android
- TalkBack + Chrome

### Visual / interaction
- 200% zoom
- 400% zoom
- Large text
- Portrait/landscape
- Narrow viewport
- Reduced motion
- High contrast

## Real-user task testing

With consent, test core tasks with a blind member and, when possible, Deaf/hard-of-hearing members. Suggested tasks:
1. Find an overtime provision.
2. Find Article 20 representation/discipline information.
3. Find a grievance deadline warning and steward route.
4. Find the next membership event.
5. Find the appropriate Union contact.
6. Use a training/video item with captions/transcript/ASL where offered.

Unnecessary difficulty completing these tasks is a product defect even when a technical conformance checker passes.


## Stage 6 external ChatGPT handoff

- The prepared prompt must be exposed in a standard labeled textarea and remain keyboard editable.
- Copy success/failure must be announced through the existing polite status region.
- Opening ChatGPT must be a standard link and clearly identify that it opens in a new tab.
- The user must not be required to see a visual toast to know whether copying succeeded.
- No source information should be conveyed only by badge color.
- The ChatGPT handoff is optional; equivalent primary-source access remains in the Member Hub.
- A blind, Deaf, hard-of-hearing, motor-impaired, or keyboard-only member must be able to complete the local retrieval and prompt-copy workflow independently.

## Stage 7 live-content accessibility

Live feeds must preserve the same accessibility standard as bundled content. Officer-managed announcements, resources, Board profiles, steward contacts and calendar events must use meaningful text labels and may not rely only on color, images, sound or visual layout.

Calendar content is presented primarily as a linear upcoming-events list so screen-reader users do not need to traverse a month grid. Add-to-calendar controls use text labels and standard links/downloads.

Board photos require meaningful alternative text when informational. Decorative imagery should use empty alternative text.

Any linked video or audio published through the live Resources/Announcements feeds must include the required caption/transcript alternatives, with ASL support for priority rights/training content where feasible. Publishing a link through the live feed does not waive the Local's media-accessibility requirements.

## Stage 8 document administration accessibility

Future-source maintenance must not degrade member accessibility. The Stage 8 importer therefore flags image-only/scanned pages and reports extraction/structure problems before activation.

The restricted administrator interface itself uses labeled form controls, keyboard-operable buttons, a live status region, text validation messages, and a responsive document registry. Validation state is communicated by text in addition to visual styling.

A successful PDF text extraction is not proof that tables, schedules, charts, or multi-column layouts are semantically accessible. Administrators must review complex source pages before activation. If a future CBA or Personnel Rules revision contains critical image-only information, provide verified accessible text/HTML rather than relying on the PDF image alone.

Historical source/version information must remain usable with screen readers; version/status must be conveyed in text and not by color alone.
