import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { text, sourceLanguage, targetLanguage } = body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${"AIzaSyBKntIInl9DNuuw6oEpbgCx064M3LR6u_Y"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: "text",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Google Translate API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Translation failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      original: text,
      translated: data.data.translations[0].translatedText,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
