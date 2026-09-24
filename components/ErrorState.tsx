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
      className="flex flex-col gap-3 rounded-md border border-red-300 p-4 dark:border-red-800"
    >
      <p className="wrap-break-word">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 self-start rounded-md border border-current px-4 py-2"
      >
        Try again
      </button>
    </div>
  );
}
