"use client";

// Shared error UI with a retry callback prop.

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
    >
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">Couldn&apos;t generate flashcards</p>
        <p className="text-sm wrap-break-word">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 transition-colors duration-150 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:w-auto sm:self-start dark:border-red-800 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-900/40 dark:focus-visible:outline-red-400"
      >
        Try again
      </button>
    </div>
  );
}
