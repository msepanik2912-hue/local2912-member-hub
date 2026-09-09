# Stage 5 — Retrieval Validation and Tuning

Stage 5 establishes the retrieval gate required before enabling generated Ask 2912 explanations.

## Gate 1 — corpus validation — COMPLETE

A regression set of 78 realistic member questions is stored in `tests/member_questions.json` and covers the major member-facing contract topics.

## Gate 2 — retrieval quality — COMPLETE FOR CURRENT REGRESSION SET

The Stage 4-style lexical baseline placed the expected controlling source in the top three for 72 of 78 questions (92.3%).

Stage 5 adds reviewable deterministic intent boosts in `data/retrieval_hints.json`. On the current 78-question suite:

- Top-1: 78/78 (100%)
- Top-3: 78/78 (100%)
- Top-5: 78/78 (100%)

This is a regression result, not a claim of universal accuracy. Every real-world miss should be added to the suite.

## Gate 3 — answer architecture — NEXT

The future generated Ask 2912 answer must contain:

1. Issue identified.
2. Relevant CBA Article/Section.
3. Short source-grounded plain-language explanation.
4. Any supplemental Personnel Rule, clearly labeled.
5. What the member may want to preserve/document.
6. Deadline/urgency warning where applicable.
7. Contact a Steward action.

## Hard prohibitions

The assistant must not:

- declare a contract violation as a final determination;
- promise a grievance outcome;
- state that a member does or does not have a grievance without steward review;
- invent contract text or citations;
- use general City Personnel Rule grievance deadlines for represented employees;
- represent the chat as formal notice to Local 2912;
- retain sensitive case evidence in the public Member Hub.

## Accessibility

Dynamic answers must announce only meaningful state changes, such as “Searching approved sources” and “Answer available,” then move focus to the completed response heading. Do not stream generated text word-by-word through a live region.
