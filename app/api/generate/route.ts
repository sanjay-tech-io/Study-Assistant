import { NextResponse } from "next/server";

const DIFFICULTIES = ["easy", "medium", "hard"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const { text, mode = "generate", question, difficulty } = await request.json();

    let prompt: string;

    if (mode === "generate") {
      if (!isNonEmptyString(text)) {
        return NextResponse.json(
          { error: "REQUEST_FAILED" },
          { status: 400 }
        );
      }

      prompt = `Generate 6-10 flashcards from the following notes or topic.

Notes/topic: ${text}`;
    } else if (mode === "regenerate") {
      if (!isNonEmptyString(question) || !DIFFICULTIES.includes(difficulty)) {
        return NextResponse.json(
          { error: "REQUEST_FAILED" },
          { status: 400 }
        );
      }

      prompt = `Generate exactly ONE new flashcard on the same topic as this question, but with different wording and a fresh angle: "${question}". Keep the difficulty level: ${difficulty}.`;
    } else {
      return NextResponse.json(
        { error: "REQUEST_FAILED" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[generate] Server misconfigured: GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "REQUEST_FAILED" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                cards: {
                  type: "array",
                  ...(mode === "regenerate" ? { minItems: 1, maxItems: 1 } : {}),
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      question: { type: "string" },
                      answer: { type: "string" },
                      difficulty: {
                        type: "string",
                        enum: ["easy", "medium", "hard"],
                      },
                    },
                    required: ["id", "question", "answer", "difficulty"],
                  },
                },
              },
              required: ["cards"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[generate] Gemini API error:", response.status, errorBody);
      return NextResponse.json(
        { error: "REQUEST_FAILED" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("[generate] Empty response from Gemini:", JSON.stringify(data));
      return NextResponse.json(
        { error: "REQUEST_FAILED" },
        { status: 502 }
      );
    }

    return NextResponse.json({ raw: rawText });
  } catch (err) {
    console.error("[generate] Unexpected error:", err);
    return NextResponse.json(
      { error: "REQUEST_FAILED" },
      { status: 500 }
    );
  }
}