# Smoke Test Checklist

Run this checklist before relying on the dashboard around an MU earnings event.

## Automated Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`

## Runtime Checks

- [ ] Start with `npm run dev` and confirm the dashboard loads without browser or server console errors.
- [ ] Verify laptop, tablet, and phone widths remain readable without page-level horizontal scrolling.
- [ ] Confirm all three deterministic score cards and the separate review label are visible.
- [ ] Confirm the UI states that the review label is not a trading instruction.

## Failure States

- [ ] Remove or invalidate `ALPHA_VANTAGE_API_KEY`; confirm market data shows unavailable or stale and the dashboard still loads.
- [ ] Remove `OPENAI_API_KEY`; confirm AI shows unavailable while scores and the decision remain visible.
- [ ] Temporarily set `MU_PERSISTENCE_PATH` to an unwritable location; confirm persistence shows unavailable without crashing.
- [ ] Confirm expected provider failures do not trigger a disruptive Next.js development overlay.

## Local Data

- [ ] Add a manual memory entry; confirm it appears in Memory Data and Evidence.
- [ ] Refresh and confirm the manual entry remains available through SQLite or localStorage fallback.
- [ ] Submit a post-earnings input; confirm the record and normalized earnings evidence appear.
- [ ] Restart the development server; confirm manual entries, earnings records, and decision history reload.
- [ ] If legacy localStorage entries exist, confirm they remain in browser storage after import.

## Security

- [ ] Search built client output and browser network payloads for API-key values; no provider key should be present.
- [ ] Confirm no secret variable uses a `NEXT_PUBLIC_` prefix.
- [ ] Confirm OpenAI is called only after a user requests an explanation or thesis challenge.
