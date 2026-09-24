// Shared loading UI.

export default function LoadingState() {
  return (
    <div role="status" className="flex items-center gap-3">
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>Generating flashcards…</span>
    </div>
  );
}
