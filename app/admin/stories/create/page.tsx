"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/TextArea";
import { storyService } from "@/lib/services/storyService";
import type { StoryLevel } from "@/lib/types/StoryLevel";
import { Loader2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";
import { TranslationInput } from "@/lib/types/TranslationInput";

export default function CreateStoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    original_story: "",
    original_language: "en",
    level: "beginner" as StoryLevel,
  });

  // Orijinal dil dışındaki diller için çeviriler
  const [translations, setTranslations] = useState<TranslationInput[]>(
    SUPPORTED_LANGUAGES.filter(
      (lang) => lang.code !== formData.original_language
    ).map((lang) => ({ language: lang.code, story: "" }))
  );

  // Orijinal dil değiştiğinde çevirileri güncelle
  const handleLanguageChange = (newLanguage: string) => {
    setFormData({ ...formData, original_language: newLanguage });
    setTranslations(
      SUPPORTED_LANGUAGES.filter((lang) => lang.code !== newLanguage).map(
        (lang) => {
          const existingTranslation = translations.find(
            (t) => t.language === lang.code
          );
          return {
            language: lang.code,
            story: existingTranslation?.story || "",
          };
        }
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Çevirilerin boş olup olmadığını kontrol et
    const hasEmptyTranslations = translations.some((t) => !t.story.trim());
    if (hasEmptyTranslations) {
      alert(
        "All translations are required. Please fill in all language versions."
      );
      setLoading(false);
      return;
    }

    try {
      // Önce hikayeyi oluştur
      const storyId = await storyService.createStory(formData);

      // Sonra çevirileri ekle
      await Promise.all(
        translations.map((translation) =>
          storyService.addTranslation({
            original_id: storyId as string,
            language: translation.language,
            story: translation.story,
          })
        )
      );

      router.push("/admin/stories");
    } catch (error) {
      console.error("Error creating story:", error);
      alert("Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (language: string, value: string) => {
    setTranslations(
      translations.map((t) =>
        t.language === language ? { ...t, story: value } : t
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Story</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="original_language"
                className="text-sm font-medium"
              >
                Original Language
              </label>
              <Select
                value={formData.original_language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium">
                Difficulty Level
              </label>
              <Select
                value={formData.level}
                onValueChange={(value: StoryLevel) =>
                  setFormData({ ...formData, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Original Story (
            {
              SUPPORTED_LANGUAGES.find(
                (l) => l.code === formData.original_language
              )?.name
            }
            )
          </label>
          <Textarea
            value={formData.original_story}
            onChange={(e) =>
              setFormData({ ...formData, original_story: e.target.value })
            }
            className="min-h-[200px]"
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Translations</h2>
          <p className="text-sm text-muted-foreground">
            All translations are required. Please provide the story in all
            supported languages.
          </p>

          {translations.map((translation) => (
            <div key={translation.language} className="space-y-2">
              <label className="text-sm font-medium">
                {
                  SUPPORTED_LANGUAGES.find(
                    (l) => l.code === translation.language
                  )?.name
                }
              </label>
              <Textarea
                value={translation.story}
                onChange={(e) =>
                  handleTranslationChange(translation.language, e.target.value)
                }
                className="min-h-[200px]"
                required
                placeholder={`Enter ${
                  SUPPORTED_LANGUAGES.find(
                    (l) => l.code === translation.language
                  )?.name
                } translation`}
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Story"
          )}
        </Button>
      </form>
    </div>
  );
}
