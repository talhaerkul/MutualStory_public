"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { storyService } from "@/lib/services/storyService";
import type { Story } from "@/lib/types/Story";
import type { Translation } from "@/lib/types/Translation";
import { Loader2 } from "lucide-react";
import StoryViewer from "@/components/storyViewer/StoryViewer";

export default function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStoryData = async () => {
      try {
        setLoading(true);
        const storyData = await storyService.getStoryById(id);

        if (!storyData) {
          router.push("/404");
          return;
        }

        setStory(storyData);

        // Hikayenin çevirilerini yükle
        const translations = await storyService.getStoryTranslations(id);
        // Şimdilik ilk çeviriyi kullanıyoruz, daha sonra dil seçimi eklenebilir
        setTranslation(translations[0] || null);
      } catch (err) {
        setError("Failed to load story");
        console.error("Error loading story:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStoryData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading story...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!story) {
    return null; // Router will handle redirect to 404
  }

  return (
    <div className="container max-w-screen-2xl px-0 py-10">
      <StoryViewer story={story} translation={translation!} />
    </div>
  );
}
