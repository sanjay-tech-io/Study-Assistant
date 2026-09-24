// Parses + validates the LLM's raw response against our card schema.

import type { Difficulty, Flashcard, FlashcardResult } from "@/types/result";

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFlashcard(value: unknown): value is Flashcard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    isNonEmptyString(card.id) &&
    isNonEmptyString(card.question) &&
    isNonEmptyString(card.answer) &&
    DIFFICULTIES.includes(card.difficulty as Difficulty)
  );
}

export function validateResult(raw: string): FlashcardResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("MALFORMED_JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).cards)
  ) {
    throw new Error("WRONG_SHAPE");
  }

  const cards: unknown[] = (parsed as { cards: unknown[] }).cards;

  if (cards.length === 0) {
    throw new Error("EMPTY_RESULT");
  }

  if (!cards.every(isFlashcard)) {
    throw new Error("WRONG_SHAPE");
  }

  return { cards };
}
