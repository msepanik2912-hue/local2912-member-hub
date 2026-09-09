# Stage 6 Plan — Completed Architecture

Stage 6 was revised after the Local decided not to fund API usage or supply OpenAI tokens.

The implemented model is:

1. Member enters a question in Ask 2912.
2. The PWA retrieves relevant CBA material first and Personnel Rules only as a supplemental source.
3. The Member Hub displays the source matches locally.
4. The Member Hub prepares an editable, grounded prompt locally.
5. Nothing is sent to ChatGPT automatically.
6. The member may copy the prepared prompt and open ChatGPT using the member's own account and plan access.
7. The Member Hub does not receive or store the ChatGPT conversation.

There is no Local-funded OpenAI API key, token, proxy, or server-side AI endpoint.

See `STAGE6_IMPLEMENTATION.md` for details and `STAGE7_PLAN.md` for the next stage.
