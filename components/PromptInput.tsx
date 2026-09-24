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
      <label
        htmlFor="prompt-input"
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        Paste your notes or describe a topic
      </label>
      <textarea
        id="prompt-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        placeholder="e.g. The causes of World War I, or paste a page of lecture notes"
        className="min-h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white p-4 text-base text-zinc-900 shadow-sm transition-colors duration-150 placeholder:text-zinc-400 hover:border-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-500 dark:focus-visible:border-zinc-100 dark:focus-visible:outline-zinc-100"
      />
      <button
        type="submit"
        disabled={disabled || isEmpty}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-900 sm:w-auto sm:self-start dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-zinc-100 dark:disabled:hover:bg-zinc-100"
      >
        Generate flashcards
      </button>
    </form>
  );
}
