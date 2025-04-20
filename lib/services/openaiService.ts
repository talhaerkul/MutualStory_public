import OpenAI from "openai";

// Initialize OpenAI client
let openai: OpenAI | null = null;

// System prompts for different operations
const TRANSLATION_ASSESSMENT_PROMPT = `
You are an expert language translator. Your task is to evaluate the quality of a translation.
Compare the original text with the user's translation and provide a JSON response with the following format:
{
  "score": <number between 0-100>,
  "feedback": "<brief feedback on what could be improved>",
  "new_translate": <boolean - true if translation needs significant improvement>,
  "translation": "<improved translation if new_translate is true, otherwise null>"
}

Important Guidelines:
1. If the user's translation is incomplete (only a portion of the original text), only evaluate the portion they've attempted to translate.
2. Only set new_translate to true when there are significant issues with accuracy, fluency, or meaning preservation.
3. When providing an improved translation (translation field), only translate up to the point the user has translated, not the entire original text.
4. Consider the context and language-specific nuances when evaluating.
5. Be more lenient with partial translations that end with punctuation (., ,) as they likely represent work in progress.
6. IMPORTANT: If the user's translation appears to be incomplete (like cutting off mid-sentence or containing substantially less content than the corresponding part of the original text), set new_translate to false and DO NOT provide any alternative translation.
7. Only suggest a complete alternative when the user has provided a complete sentence or logical segment that can be properly evaluated.
8. When in doubt about completeness, err on the side of not providing an alternative translation.

Example: If the original text has 3 sentences but the user has only translated 1 sentence and it ends with a period, only assess that 1 completed sentence.
`;

const ALTERNATIVE_TRANSLATIONS_PROMPT = `
You are an expert language translator. Your task is to provide alternative translations for the given text.
The user has provided their own translation, but is looking for alternatives that:
1. Preserve the original meaning
2. May use different vocabulary or sentence structure
3. Sound natural in the target language

Provide a JSON response with the following format:
{
  "alternatives": [<alternative1>, <alternative2>]
}

Important Guidelines:
1. Only generate alternatives for the specific portion of the original text that the user has attempted to translate.
2. If the user's translation ends with a period, assume it's a complete sentence and provide alternatives for that sentence.
3. If the user's translation ends with a comma, only provide alternatives up to that natural break.
4. Provide exactly 2 alternatives that are meaningfully different from each other and from the user's translation.
5. If a high-quality alternative isn't possible, provide fewer.
6. Maintain the same level of formality and style as the user's translation.

Example: If the original is a paragraph but the user has only translated the first sentence, only provide alternatives for that first sentence.
`;

// Initialize the OpenAI client once when needed
const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not set");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

export const openaiService = {
  /**
   * Assesses the quality of a translation
   */
  assessTranslation: async (
    originalText: string,
    userTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    score: number;
    feedback: string;
    new_translate: boolean;
    translation: string | null;
  }> => {
    try {
      const client = getOpenAIClient();

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: TRANSLATION_ASSESSMENT_PROMPT },
          {
            role: "user",
            content: `
              Original text (${sourceLanguage}): ${originalText}
              User translation (${targetLanguage}): ${userTranslation}
              
              Evaluate this translation and provide the JSON response as specified.
            `,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content =
        response.choices[0]?.message.content ||
        '{"score": 0, "feedback": "Error processing response", "new_translate": false, "translation": null}';

      try {
        const result = JSON.parse(content);
        return {
          score: result.score || 0,
          feedback: result.feedback || "No feedback available",
          new_translate: result.new_translate || false,
          translation: result.translation || null,
        };
      } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        return {
          score: 0,
          feedback: "Error processing assessment",
          new_translate: false,
          translation: null,
        };
      }
    } catch (error) {
      console.error("Error assessing translation:", error);
      return {
        score: 0,
        feedback: "Error assessing translation",
        new_translate: false,
        translation: null,
      };
    }
  },

  /**
   * Generates alternative translations for a given text
   */
  getAlternativeTranslations: async (
    originalText: string,
    userTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string[]> => {
    try {
      const client = getOpenAIClient();

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ALTERNATIVE_TRANSLATIONS_PROMPT },
          {
            role: "user",
            content: `
              Original text (${sourceLanguage}): ${originalText}
              User translation (${targetLanguage}): ${userTranslation}
              
              Please provide exactly 2 alternative translations only for the part that the user has translated.
            `,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content =
        response.choices[0]?.message.content || '{"alternatives": []}';

      try {
        const result = JSON.parse(content);
        // Ensure we return at most 2 alternatives
        return Array.isArray(result.alternatives)
          ? result.alternatives.slice(0, 2)
          : [];
      } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        return [];
      }
    } catch (error) {
      console.error("Error generating alternative translations:", error);
      return [];
    }
  },

  /**
   * Auto-completes translation as the user types
   */
  autoCompleteTranslation: async (
    originalText: string,
    partialTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> => {
    try {
      const client = getOpenAIClient();

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert language translator from ${sourceLanguage} to ${targetLanguage}. 
                      Complete the partial translation provided by the user in a natural way,
                      preserving the meaning from the original text. Only provide the completed translation.`,
          },
          {
            role: "user",
            content: `
              Original text (${sourceLanguage}): ${originalText}
              Partial translation (${targetLanguage}): ${partialTranslation}
              
              Please complete the translation in a natural way.
            `,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message.content || partialTranslation;
    } catch (error) {
      console.error("Error auto-completing translation:", error);
      return partialTranslation;
    }
  },
};
