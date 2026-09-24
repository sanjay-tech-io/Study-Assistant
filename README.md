Flashcard Generator

Project option: Study assistant (flashcards + quiz)

Live demo: https://study-assistant-sable.vercel.app/

This was my submission for FLAM's Frontend Internship assignment. I picked the Study Assistant option: paste in your notes or just name a topic, and the app asks Google Gemini to turn it into a deck of 6–10 flashcards, each tagged easy, medium, or hard. From there you can flip through them, run a quiz on yourself, retest just the ones you got wrong, and regenerate any single card if you don't like how it came out.


How I approached it

I started by designing the JSON shape I wanted back from the model before writing a single line of UI code — an array of cards with id, question, answer, and difficulty. Everything downstream, from the prompt to the validation logic to the component props, was built around that one shape staying fixed.

The app is a single Next.js project so the frontend and backend deploy together with no CORS setup: a serverless API route holds my Gemini key and is the only code that ever talks to the model. The frontend never sees the key and never calls Gemini directly.

Along the way I hit a real snag that ended up being a good lesson: my first model choice (gemini-2.5-flash, then gemini-2.0-flash) had been retired since I picked it, and the replacement (gemini-3.6-flash) was temporarily overloaded when I tested it. I ended up on gemini-3.5-flash-lite, which worked reliably — a small reminder that "pick any model, it doesn't affect your score" doesn't mean the model won't occasionally get in your way.


Setup:

Requires Node.js 20+ and a Gemini API key.

bash
git clone https://github.com/sanjay-tech-io/Study-Assistant
cd flam-project
npm install

Create .env.local in the project root, using .env.example as a template:

GEMINI_API_KEY=generated_api_key

Then run:

bash
npm run dev

and open http://localhost:3000.


Usage

1. Generate — paste your notes or type a topic, click Generate flashcards.
2. Browse — click a card to flip between question and answer.
3. Regenerate — not happy with a card? Click Regenerate to swap it for a new one at the same difficulty, without touching the rest of the deck.
4. Quiz — click Start Quiz to go through the deck in shuffled order. Reveal each answer, then mark Got it right or Got it wrong.
5. Retest — the results screen shows your score, with a Retest wrong answers option that runs a fresh pass on just the ones you missed. Back to cards takes you out of the quiz at any point.


Architecture

I split the app into three layers on purpose, rather than letting the API call, the validation, and the rendering blur together:

1. API route (app/api/generate/route.ts) — the only code that talks to Gemini, and the only place the API key is used. It returns Gemini's raw text as { raw }, or { error: "REQUEST_FAILED" } on any failure, without ever leaking Gemini's internal error details to the browser.
2. lib/ — lib/api.ts calls my own route (never Gemini directly) with a 20-second client-side timeout. lib/validateResult.ts parses that raw string and checks it against the shape defined in types/result.ts, throwing a specific error code for each way it can go wrong.
3. components/ — the UI. Every component only ever receives cards that have already passed validation; nothing renders unchecked model output.

Keeping validation separate from rendering meant that every failure mode — malformed JSON, wrong shape, an empty deck — became one named error code in one file, instead of scattered try/catch guesses across the UI. page.tsx maps those codes to plain-language messages, so no component ever has to reason about what could be wrong with the data it's holding.


AI usage

I built this with Claude Code (in VS Code) doing the actual typing, working from detailed specs I wrote and reviewed at every step — I didn't move to the next file until I understood the one before it. I personally tested all five required failure modes: four through curl directly against the API route (an invalid model name, an empty card list, malformed JSON, and a wrong-shape response), and the timeout by watching the DevTools Network tab in the browser, where I confirmed the request actually gets cancelled at 20 seconds. I also manually walked through the full flow — including firing off two card regenerations back to back to check they don't interfere with each other — on both a normal desktop window and a 375px mobile view.


Known limitations

1. Regenerate has limited context. It only sends the clicked card's question back to the model, not my original notes, so a regenerated card can occasionally repeat something another card already covers.
2. No persistence or accounts. Refresh the page and the deck is gone — there's no save/reload or auth, since the assignment didn't call for either.
3. No rate limiting. Anyone who can reach /api/generate can spend my Gemini quota.
The server doesn't stop when the client times out. My 20-second timeout only cancels the browser's request; Gemini's call keeps running server-side until it finishes.
4. One error message for every server-side failure. The route always returns REQUEST_FAILED, so the UI can't distinguish "bad input" from "missing key" from "Gemini failed" — the specifics only show up in the server logs.
5. Duplicate card IDs aren't rejected. If Gemini ever returns two cards sharing an id, they'd flip together in browse mode.
6. A running quiz doesn't pick up a regenerated card. The quiz keeps the deck it started with; a regenerated card only shows up the next time you start a new quiz.
7. No automated tests. I relied on tsc, eslint, and hands-on testing (curl + browser) rather than a test suite, given the time budget.


Time spent

3 hours