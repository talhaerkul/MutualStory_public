import { type NextRequest, NextResponse } from "next/server";
import { openaiService } from "@/lib/services/openaiService";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const {
      action,
      originalText,
      userTranslation,
      sourceLanguage,
      targetLanguage,
    } = body;

    if (!action || !originalText || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For assessment and alternatives, we need userTranslation
    if (
      (action === "assess" || action === "alternatives") &&
      !userTranslation
    ) {
      return NextResponse.json(
        { error: "Missing user translation" },
        { status: 400 }
      );
    }

    switch (action) {
      case "assess":
        const assessment = await openaiService.assessTranslation(
          originalText,
          userTranslation,
          sourceLanguage,
          targetLanguage
        );
        return NextResponse.json(assessment);

      case "alternatives":
        const alternatives = await openaiService.getAlternativeTranslations(
          originalText,
          userTranslation,
          sourceLanguage,
          targetLanguage
        );
        return NextResponse.json({ alternatives });

      case "autocomplete":
        const partialTranslation = userTranslation || "";
        const completedTranslation =
          await openaiService.autoCompleteTranslation(
            originalText,
            partialTranslation,
            sourceLanguage,
            targetLanguage
          );
        return NextResponse.json({ translation: completedTranslation });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
