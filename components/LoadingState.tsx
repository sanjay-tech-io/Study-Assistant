// Shared loading UI.

export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
        <span>Generating flashcards…</span>
      </div>

      {/* Skeleton cards in the same grid as the real deck, so the layout doesn't jump. */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
              i === 2 ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-800" />
            <div className="flex h-32 flex-col gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-700" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-700" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
