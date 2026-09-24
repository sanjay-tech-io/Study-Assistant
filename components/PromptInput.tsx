"use client";

// Free-form textarea + submit button.

import { useState, type FormEvent } from "react";

type PromptInputProps = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

export default function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [text, setText] = useState("");
  const isEmpty = text.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isEmpty) return;
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="prompt-input" className="text-sm font-medium">
        Paste your notes or describe a topic
      </label>
      <textarea
        id="prompt-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        className="min-h-32 w-full resize-y rounded-md border border-zinc-300 p-3 text-base dark:border-zinc-700"
      />
      <button
        type="submit"
        disabled={disabled || isEmpty}
        className="min-h-11 w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 sm:w-auto sm:self-start dark:bg-white dark:text-black"
      >
        Generate flashcards
      </button>
    </form>
  );
}
