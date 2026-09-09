# Stage 6 Implementation — Member-Owned ChatGPT Handoff

## Architecture decision

Ask 2912 does **not** call the OpenAI API. Local 2912 supplies no API key and pays for no AI tokens.

The Member Hub performs source retrieval locally. An optional external handoff is created only after retrieval. The handoff is deliberately **copy + open**, not an automatic submission.

## Prompt construction

The prepared prompt includes:

- the member's question;
- explicit instruction to use only supplied source excerpts;
- CBA-first source hierarchy;
- up to three CBA excerpts;
- at most one Personnel Rules excerpt;
- a prohibition on inventing language, deadlines, facts, or outcomes;
- required structured headings;
- mandatory steward-review language; and
- a warning not to calculate definitive grievance deadlines from incomplete facts.

## Privacy

No member question is sent automatically to ChatGPT. The member sees an editable prompt before any copy or external navigation. ChatGPT conversation history is not returned to or stored by the Member Hub.

## Accessibility

The handoff uses a labeled editable textarea, standard buttons/links, keyboard-operable controls, screen-reader status announcements, and explicit new-tab text. No step depends on drag, hover, color, sight, or hearing.

## Failure behavior

If source retrieval fails, the external handoff is hidden. If retrieval returns no close match, the prepared prompt explicitly states that no sufficiently close excerpt was identified and requires ChatGPT to say when the supplied material does not answer the question.
