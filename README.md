# Flashcard Generator

**Project option:** Study assistant (flashcards + quiz)

Paste your notes or name a topic, and the app uses Google Gemini to turn it into a deck of 6–10 flashcards, each tagged easy, medium or hard. You can flip through the cards, quiz yourself, retest only the cards you got wrong, and regenerate any single card you don't like.

## Setup

Requires Node.js 20+ and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone <your-repo-url-here>
cd flam-project
npm install
```

Create `.env.local` in the project root, using `.env.example` as the template:

```
GEMINI_API_KEY=your-key-here
```

Then start the dev server and open http://localhost:3000:

```bash
npm run dev
```

## Usage

1. **Generate:** paste notes or type a topic into the text box and click **Generate flashcards**.
2. **Browse:** click a card to flip between its question and answer.
3. **Regenerate:** click **Regenerate** on a card to replace just that card with a new one at the same difficulty.
4. **Quiz:** click **Start Quiz** to go through the cards one at a time in shuffled order. Reveal each answer, then mark it **Got it right** or **Got it wrong**.
5. **Retest:** the results screen shows your score. **Retest wrong answers** runs a new pass with only the cards you missed. **Back to cards** returns to browsing at any time.

## Architecture

The app is split into three layers:

- **API route** ([app/api/generate/route.ts](app/api/generate/route.ts)): the only code that talks to Gemini and the only place the API key is used. It returns Gemini's output as an unparsed string (`{ raw }`), or `{ error: "REQUEST_FAILED" }` on any failure.
- **`lib/`**: [lib/api.ts](lib/api.ts) calls our own route, with a 20-second timeout. [lib/validateResult.ts](lib/validateResult.ts) parses the raw string and checks it against the card types in [types/result.ts](types/result.ts).
- **`components/`**: the UI. It only ever receives cards that have already passed validation.

Validation is kept separate from rendering so that every way the LLM output can go wrong (malformed JSON, wrong shape, empty deck) becomes a named error code in one place. The page maps those codes to readable messages, so components never have to handle half-valid data.

## AI usage

Claude (via Claude Code in VS Code) implemented this project from detailed specifications I reviewed and iterated on at each step, and I understood and could explain every file before moving to the next one. I tested all five failure modes myself — four via curl against the API route (invalid model, empty result, malformed JSON, wrong shape) and the timeout via the browser with the DevTools Network tab open, confirming the client aborts at 20 seconds. I manually verified the full user flow, including card regeneration with concurrent requests, on both desktop and a 375px mobile viewport.

## Known limitations

- **Regenerate has little context.** It only sends the clicked card's question, not the original notes, so a regenerated card may repeat another card's content.
- **No persistence or accounts.** Refreshing the page loses the deck, and there is no auth or saved history.
- **No rate limiting.** Anyone who can reach `/api/generate` can spend the Gemini quota.
- **Timeouts don't stop the server.** The 20-second timeout only cancels the browser's request; the server still waits for Gemini to finish.
- **One error message for all server failures.** The route returns `REQUEST_FAILED` for every error, so the UI shows the same message whether the input was invalid, the key is missing, or Gemini failed. Details only appear in the server logs.
- **Duplicate card ids aren't rejected.** If Gemini returns two cards with the same `id`, they flip together in browse mode.
- **Running quizzes don't update.** A quiz already in progress keeps the cards it started with; regenerated cards appear from the next quiz.
- **No automated tests.** Verification was type-checking, linting, and manual or curl testing only.

## Time spent

[X] hours
