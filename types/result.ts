// TypeScript types for our flashcard JSON shape.
// This is the contract between validateResult.ts and the UI components.

export type Difficulty = "easy" | "medium" | "hard";

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
};

export type FlashcardResult = {
  cards: Flashcard[];
};
