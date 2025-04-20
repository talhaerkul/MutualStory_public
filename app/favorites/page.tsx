"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { storyService } from "@/lib/services/storyService";
import type { Story } from "@/lib/types/Story";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/Button";
import { Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const favoriteStories = await storyService.getFavoriteStories(user.uid);
      setStories(favoriteStories);
      setError(null);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("Failed to load favorite stories");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground mb-4">
          You need to be logged in to view your favorites
        </p>
        <Button asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            onClick={loadFavorites}
            className="text-red-700 hover:text-red-800"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">My Favorites</h1>
        <p className="text-muted-foreground">
          Your collection of favorite stories
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading favorites...</span>
          </div>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No favorite stories yet</p>
          <Button asChild>
            <Link href="/">Browse Stories</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              id={story.id}
              title={story.title}
              description={story.original_story.substring(0, 150) + "..."}
              level={story.level}
              original_language={story.original_language}
              createdAt={story.createdAt as string}
              initialFavorited={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
