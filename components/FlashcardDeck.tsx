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

const buttonClass =
  "min-h-11 rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black";
const secondaryButtonClass = "min-h-11 rounded-md border border-current px-4 py-2";
// Full-width on phones for an easy tap target, natural width from sm up.
const blockButtonClass = `w-full sm:w-auto sm:self-start ${buttonClass}`;

// Fisher-Yates shuffle on a copy, so the original cards array is never mutated.
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
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
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            Card {quizIndex + 1} of {quizQueue.length}
          </span>
          <DifficultyBadge difficulty={card.difficulty} />
        </div>

        <div className="flex min-h-40 flex-col gap-4 rounded-lg border border-zinc-300 p-4 wrap-break-word sm:p-6 dark:border-zinc-700">
          <p className="text-lg font-medium">{card.question}</p>
          {quizAnswerRevealed && (
            <p className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {card.answer}
            </p>
          )}
        </div>

        {quizAnswerRevealed ? (
          <div className="flex flex-wrap gap-3">
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
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setQuizAnswerRevealed(true)}
            className={blockButtonClass}
          >
            Show Answer
          </button>
        )}
      </section>
    );
  }

  if (mode === "results") {
    const total = quizQueue.length;
    const correctCount = total - wrongCards.length;
    return (
      <section className="flex flex-col gap-4">
        <p className="text-lg font-medium">
          You got {correctCount} out of {total} right
        </p>
        {wrongCards.length === 0 && (
          <p>Nice work, you got every card right!</p>
        )}
        <div className="flex flex-wrap gap-3">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const flipped = flippedIds.has(card.id);
          const isRegenerating = regeneratingIds.has(card.id);
          const regenerateError = regenerateErrors[card.id];
          return (
            <div
              key={card.id}
              className="flex min-h-40 min-w-0 flex-col gap-3 rounded-lg border border-zinc-300 p-4 wrap-break-word dark:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-2">
                <DifficultyBadge difficulty={card.difficulty} />
                <button
                  type="button"
                  onClick={() => handleRegenerate(card, index)}
                  disabled={isRegenerating}
                  className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {isRegenerating && (
                    <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {isRegenerating ? "Regenerating…" : "Regenerate"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleFlipped(card.id)}
                aria-pressed={flipped}
                disabled={isRegenerating}
                className="flex flex-1 flex-col gap-2 rounded-md text-left transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:hover:bg-zinc-900"
              >
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {flipped ? "Answer" : "Question"}
                </span>
                <span>{flipped ? card.answer : card.question}</span>
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

      <button
        type="button"
        onClick={() => startQuiz(shuffle(cards))}
        className={blockButtonClass}
      >
        Start Quiz
      </button>
    </section>
  );
}
