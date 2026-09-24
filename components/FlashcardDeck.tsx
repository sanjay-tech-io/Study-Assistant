"use client";

// Renders the validated cards, flip + quiz mode.

import { useState } from "react";

import { regenerateCard } from "@/lib/api";
import { validateResult } from "@/lib/validateResult";
import type { Difficulty, Flashcard } from "@/types/result";

type FlashcardDeckProps = {
  cards: Flashcard[];
};

type Mode = "browse" | "quiz" | "results";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";
// Full-width on phones for an easy tap target, natural width from sm up.
const buttonBase = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${focusRing}`;
const buttonClass = `${buttonBase} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`;
const secondaryButtonClass = `${buttonBase} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`;
const ghostButtonClass = `inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${focusRing}`;

// Shared by quiz and results so switching between them doesn't shift the layout.
const panelClass =
  "flex min-h-56 flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm wrap-break-word dark:border-zinc-800 dark:bg-zinc-900";
const actionsClass = "flex flex-col gap-3 sm:flex-row";
const faceLabelClass = "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

// Fisher-Yates shuffle on a copy, so the original cards array is never mutated.
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pluralizeCards(count: number): string {
  return `${count} card${count === 1 ? "" : "s"}`;
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{meta}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
  );
}

export default function FlashcardDeck({ cards: initialCards }: FlashcardDeckProps) {
  // Owned locally so single cards can be swapped out by "Regenerate".
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [regenerateErrors, setRegenerateErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("browse");
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizQueue, setQuizQueue] = useState<Flashcard[]>(() => [...cards]);
  const [wrongCards, setWrongCards] = useState<Flashcard[]>([]);
  const [quizAnswerRevealed, setQuizAnswerRevealed] = useState(false);

  function toggleFlipped(id: string) {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleRegenerate(card: Flashcard, index: number) {
    setRegeneratingIds((prev) => new Set(prev).add(card.id));
    setRegenerateErrors((prev) => {
      const next = { ...prev };
      delete next[card.id];
      return next;
    });

    try {
      const raw = await regenerateCard(card.question, card.difficulty);
      const [newCard] = validateResult(raw).cards;
      setCards((prev) => {
        const matchIndex = prev.findIndex((c) => c.id === card.id);
        const target = matchIndex !== -1 ? matchIndex : index;
        const next = [...prev];
        // Keep the old id so it stays unique in the deck and per-card state stays attached.
        next[target] = { ...newCard, id: card.id };
        return next;
      });
      // Show the new card question-side up.
      setFlippedIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message === "TIMEOUT"
          ? "That took too long. Please try again."
          : "Couldn't regenerate this card. Please try again.";
      setRegenerateErrors((prev) => ({ ...prev, [card.id]: message }));
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }

  function startQuiz(queue: Flashcard[]) {
    setQuizQueue(queue);
    setQuizIndex(0);
    setWrongCards([]);
    setQuizAnswerRevealed(false);
    setMode("quiz");
  }

  function answerCard(correct: boolean) {
    if (!correct) {
      const card = quizQueue[quizIndex];
      setWrongCards((prev) => [...prev, card]);
    }
    setQuizAnswerRevealed(false);
    if (quizIndex + 1 === quizQueue.length) {
      setMode("results");
    } else {
      setQuizIndex(quizIndex + 1);
    }
  }

  if (mode === "quiz") {
    const card = quizQueue[quizIndex];
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader title="Quiz" meta={`Card ${quizIndex + 1} of ${quizQueue.length}`} />

        <div className={panelClass}>
          <div className="flex items-center justify-between gap-2">
            <span className={faceLabelClass}>Question</span>
            <DifficultyBadge difficulty={card.difficulty} />
          </div>
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            {card.question}
          </p>
          {quizAnswerRevealed && (
            <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className={faceLabelClass}>Answer</span>
              <p className="text-base text-zinc-700 dark:text-zinc-300">{card.answer}</p>
            </div>
          )}
        </div>

        <div className={actionsClass}>
          {quizAnswerRevealed ? (
            <>
              <button type="button" onClick={() => answerCard(true)} className={buttonClass}>
                Got it right
              </button>
              <button
                type="button"
                onClick={() => answerCard(false)}
                className={secondaryButtonClass}
              >
                Got it wrong
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setQuizAnswerRevealed(true)}
              className={buttonClass}
            >
              Show Answer
            </button>
          )}
        </div>
      </section>
    );
  }

  if (mode === "results") {
    const total = quizQueue.length;
    const correctCount = total - wrongCards.length;
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader title="Results" meta={pluralizeCards(total)} />

        <div className={panelClass}>
          <span className={faceLabelClass}>Score</span>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {correctCount}/{total}
          </p>
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            You got {correctCount} out of {total} right
          </p>
          {wrongCards.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nice work, you got every card right!
            </p>
          )}
        </div>

        <div className={actionsClass}>
          {wrongCards.length > 0 && (
            <button
              type="button"
              onClick={() => startQuiz(wrongCards)}
              className={buttonClass}
            >
              Retest wrong answers
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={secondaryButtonClass}
          >
            Back to cards
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Your deck"
        meta={`${pluralizeCards(cards.length)} · tap a card to flip it`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const flipped = flippedIds.has(card.id);
          const isRegenerating = regeneratingIds.has(card.id);
          const regenerateError = regenerateErrors[card.id];
          return (
            <div
              key={card.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-2">
                <DifficultyBadge difficulty={card.difficulty} />
                <button
                  type="button"
                  onClick={() => handleRegenerate(card, index)}
                  disabled={isRegenerating}
                  className={ghostButtonClass}
                >
                  {isRegenerating ? (
                    <Spinner />
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0"
                    >
                      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5" />
                    </svg>
                  )}
                  {isRegenerating ? "Regenerating…" : "Regenerate"}
                </button>
              </div>

              {/* The button itself stays put (so keyboard focus is kept); the faces inside rotate. */}
              <button
                type="button"
                onClick={() => toggleFlipped(card.id)}
                aria-pressed={flipped}
                disabled={isRegenerating}
                className={`group flex flex-1 rounded-lg text-left perspective-distant disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                <span
                  className={`grid flex-1 grid-cols-1 transition-transform duration-400 ease-out transform-3d motion-reduce:transition-none ${
                    flipped ? "rotate-y-180" : ""
                  }`}
                >
                  <span
                    aria-hidden={flipped}
                    className="flex min-h-32 min-w-0 flex-col gap-2 rounded-lg bg-zinc-50 p-4 wrap-break-word backface-hidden transition-colors duration-150 [grid-area:1/1] group-hover:bg-zinc-100 dark:bg-zinc-800/60 dark:group-hover:bg-zinc-800"
                  >
                    <span className={faceLabelClass}>Question</span>
                    <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {card.question}
                    </span>
                  </span>
                  <span
                    aria-hidden={!flipped}
                    className="flex min-h-32 min-w-0 rotate-y-180 flex-col gap-2 rounded-lg bg-zinc-900 p-4 wrap-break-word backface-hidden transition-colors duration-150 [grid-area:1/1] group-hover:bg-zinc-800 dark:bg-zinc-100 dark:group-hover:bg-zinc-200"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Answer
                    </span>
                    <span className="text-base text-zinc-100 dark:text-zinc-800">
                      {card.answer}
                    </span>
                  </span>
                </span>
              </button>

              {regenerateError && (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {regenerateError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={actionsClass}>
        <button
          type="button"
          onClick={() => startQuiz(shuffle(cards))}
          className={buttonClass}
        >
          Start Quiz
        </button>
      </div>
    </section>
  );
}
