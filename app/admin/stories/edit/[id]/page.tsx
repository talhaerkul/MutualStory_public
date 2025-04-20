"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { storyService } from "@/lib/services/storyService";
import type { Story } from "@/lib/types/Story";
import type { StoryLevel } from "@/lib/types/StoryLevel";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/TextArea";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { TranslationUpdate } from "@/lib/types/TranslationUpdate";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";

export default function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storyData, setStoryData] = useState<Partial<Story>>({
    title: "",
    original_story: "",
    level: "beginner",
    original_language: "en",
  });
  const [translations, setTranslations] = useState<TranslationUpdate[]>([]);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const { story, translations: loadedTranslations } =
        await storyService.getStoryWithTranslations(id);
      if (!story) {
        toast.error("Story not found");
        router.push("/admin/stories");
        return;
      }

      // Set story data
      setStoryData({
        title: story.title,
        original_story: story.original_story,
        level: story.level,
        original_language: story.original_language,
      });

      // Convert existing translations to TranslationUpdate format
      const translationUpdates: TranslationUpdate[] = loadedTranslations.map(
        (translation) => ({
          language: translation.language,
          story: translation.story,
        })
      );

      setTranslations(translationUpdates);
    } catch (error) {
      console.error("Error loading story:", error);
      toast.error("Failed to load story");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storyData.title || !storyData.original_story) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      await storyService.updateStory(id, storyData, translations);
      toast.success("Story updated successfully");
      router.push("/admin/stories");
    } catch (error) {
      console.error("Error updating story:", error);
      toast.error("Failed to update story");
    } finally {
      setSaving(false);
    }
  };

  const handleTranslationChange = (language: string, story: string) => {
    setTranslations((prev) => {
      const existing = prev.findIndex((t) => t.language === language);
      if (existing !== -1) {
        // Update existing translation
        const updated = [...prev];
        updated[existing] = { language, story };
        return updated;
      }
      // Add new translation
      return [...prev, { language, story }];
    });
  };

  const getTranslationContent = (language: string) => {
    return translations.find((t) => t.language === language)?.story || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Story</h1>
          <p className="text-muted-foreground">
            Update your story and its translations
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={storyData.title}
                  onChange={(e) =>
                    setStoryData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="original_story">Original Story</Label>
                <Textarea
                  id="original_story"
                  value={storyData.original_story}
                  onChange={(e) =>
                    setStoryData((prev) => ({
                      ...prev,
                      original_story: e.target.value,
                    }))
                  }
                  required
                  rows={10}
                />
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={storyData.level}
                    onValueChange={(value: StoryLevel) =>
                      setStoryData((prev) => ({ ...prev, level: value }))
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
                <div className="grid gap-2">
                  <Label htmlFor="original_language">Original Language</Label>
                  <Select
                    value={storyData.original_language}
                    onValueChange={(value: string) =>
                      setStoryData((prev) => ({
                        ...prev,
                        original_language: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.code.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {SUPPORTED_LANGUAGES.filter(
                (lang) => lang.code !== storyData.original_language
              ).map((language) => (
                <div key={language.code} className="grid gap-2">
                  <Label htmlFor={`translation-${language}`}>
                    {language.code.toUpperCase()} Translation
                  </Label>
                  <Textarea
                    id={`translation-${language}`}
                    value={getTranslationContent(language.code)}
                    onChange={(e) =>
                      handleTranslationChange(language.code, e.target.value)
                    }
                    rows={10}
                    placeholder={`Enter ${language.code.toUpperCase()} translation`}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={saving} className="ml-auto">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
