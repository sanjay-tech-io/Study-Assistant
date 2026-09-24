// Frontend-only: calls our own /api/generate, never the LLM directly.

const TIMEOUT_MS = 20_000;

type GenerateResponse = {
  raw?: unknown;
  error?: string;
};

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function generateFlashcards(text: string): Promise<string> {
  return postToGenerate({ text });
}

export function regenerateCard(question: string, difficulty: string): Promise<string> {
  return postToGenerate({ mode: "regenerate", question, difficulty });
}

// Shared POST to /api/generate: 20s timeout, error codes, returns the raw LLM string.
async function postToGenerate(body: Record<string, string>): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: GenerateResponse;
    try {
      data = await response.json();
    } catch (err) {
      // The timeout can also fire while the body is still being read.
      if (isAbortError(err)) throw err;
      // Body wasn't JSON (e.g. a crashed server returning an HTML error page).
      throw new Error("REQUEST_FAILED");
    }

    if (!response.ok) {
      throw new Error(data.error ?? "REQUEST_FAILED");
    }

    if (typeof data.raw !== "string") {
      throw new Error("REQUEST_FAILED");
    }

    return data.raw;
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error("TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
