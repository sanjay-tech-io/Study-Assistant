"use client";

import { useRef, useState } from "react";

import ErrorState from "@/components/ErrorState";
import FlashcardDeck from "@/components/FlashcardDeck";
import LoadingState from "@/components/LoadingState";
import PromptInput from "@/components/PromptInput";
import { generateFlashcards } from "@/lib/api";
import { validateResult } from "@/lib/validateResult";
import type { FlashcardResult } from "@/types/result";

type Status = "idle" | "loading" | "success" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  MALFORMED_JSON: "The AI returned something we couldn't read. Please try again.",
  WRONG_SHAPE: "The AI returned an unexpected format. Please try again.",
  EMPTY_RESULT: "No flashcards were generated. Try adding more detail to your text.",
  REQUEST_FAILED: "We couldn't reach the server. Please try again.",
  TIMEOUT: "That took too long. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

function toReadableError(code: string | null): string {
  return (code && ERROR_MESSAGES[code]) || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export default function Home() {
  // Last submitted text, kept so "Try again" can resend it.
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<FlashcardResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  async function handleSubmit(text: string) {
    const id = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const raw = await generateFlashcards(text);
      const validated = validateResult(raw);
      if (id !== requestIdRef.current) return; // a newer request started, discard this one
      setResult(validated);
      setStatus("success");
    } catch (err) {
      if (id !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
      setErrorMessage(message);
      setStatus("error");
    }
  }

  function handlePromptSubmit(text: string) {
    setInputText(text);
    handleSubmit(text);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 font-sans sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Flashcard Generator
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          Turn your notes into flashcards, then quiz yourself.
        </p>
      </header>

      <PromptInput onSubmit={handlePromptSubmit} disabled={status === "loading"} />

      {status === "idle" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 px-6 py-12 text-center dark:border-zinc-800">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-zinc-300 dark:text-zinc-700"
          >
            <rect x="3" y="7" width="14" height="12" rx="2" />
            <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
          </svg>
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            Your flashcards will appear here
          </p>
          <p className="max-w-sm text-sm text-zinc-500">
            Generate a deck above, then flip through the cards or quiz yourself.
          </p>
        </div>
      )}

      {status === "loading" && <LoadingState />}

      {status === "error" && (
        <ErrorState
          message={toReadableError(errorMessage)}
          onRetry={() => handleSubmit(inputText)}
        />
      )}

      {status === "success" && result && <FlashcardDeck cards={result.cards} />}
    </main>
  );
}
