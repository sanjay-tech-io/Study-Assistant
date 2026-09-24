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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Flashcard Generator</h1>

      <PromptInput onSubmit={handlePromptSubmit} disabled={status === "loading"} />

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
