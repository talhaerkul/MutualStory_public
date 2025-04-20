"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { storyService } from "@/lib/services/storyService";
import type { Story } from "@/lib/types/Story";
import type { StoryLevel } from "@/lib/types/StoryLevel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Loader2, ChevronRight, BookOpen, Search, X } from "lucide-react";
import { Banner } from "@/lib/types/Banner";
import { Quote } from "@/lib/types/Quote";
import { contentService } from "@/lib/services/contentService";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<StoryLevel | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
    loadContent();
    loadStories();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const favorites = await storyService.getFavorites(user.uid);
      setFavoriteIds(favorites);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const [storiesData, activeBanner, activeQuote] = await Promise.all([
        storyService.getAllStories(),
        contentService.getActiveBanner(),
        contentService.getActiveQuote(),
      ]);

      setStories(storiesData);
      setBanner(activeBanner);
      setQuote(activeQuote);
      setError(null);
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };
  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await storyService.getAllStories();
      setStories(data);
      setHasMore(data.length > ITEMS_PER_PAGE);
      setError(null);
    } catch (err) {
      console.error("Error loading stories:", err);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadStories();
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const results = await storyService.searchStories(searchTerm.trim());
      setStories(results);
      setHasMore(results.length > ITEMS_PER_PAGE);
      setPage(1); // Reset pagination when searching
      setError(null);
    } catch (err) {
      console.error("Error searching stories:", err);
      setError("Failed to search stories");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const filteredStories = stories.filter((story) =>
    selectedLevel === "all" ? true : story.level === selectedLevel
  );

  const paginatedStories = filteredStories.slice(0, page * ITEMS_PER_PAGE);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            onClick={loadStories}
            className="text-red-700 hover:text-red-800"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Banner Section */}
      {banner && (
        <section className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="container mx-auto py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold text-gradient leading-tight">
                  {banner.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {banner.description}
                </p>
                <Button size="lg" className="hover-lift hover-glow">
                  <Link href={banner.buttonLink} className="flex items-center">
                    {banner.buttonText}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-2xl hover-lift">
                <img
                  src={banner.imageUrl || "/placeholder.svg"}
                  alt="Language Learning"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stories Section */}
      <section className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gradient mb-2">Stories</h2>
            <p className="text-muted-foreground">
              Explore our collection of engaging stories
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8" // Added padding for the clear button
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setSearchTerm("");
                    loadStories(); // Reset to original stories list
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSearch}
              disabled={loading}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Select
              value={selectedLevel}
              onValueChange={(value: StoryLevel | "all") =>
                setSelectedLevel(value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>
                {isSearching ? "Searching stories..." : "Loading stories..."}
              </span>
            </div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "No stories found matching your search"
                : selectedLevel === "all"
                ? "No stories found"
                : `No ${selectedLevel} level stories found`}
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  loadStories();
                }}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  description={story.original_story.substring(0, 150) + "..."}
                  level={story.level}
                  original_language={story.original_language}
                  createdAt={story.createdAt as string}
                  initialFavorited={favoriteIds.includes(story.id!)}
                />
              ))}
            </div>

            {hasMore && paginatedStories.length < filteredStories.length && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPage((p) => p + 1)}
                  className="hover-lift"
                >
                  Load More Stories
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Quote of the Day Section */}
      {quote && (
        <section className="container mx-auto py-6">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 md:p-12">
            <blockquote className="space-y-4">
              <p className="text-xl md:text-2xl font-medium text-foreground">
                "{quote.quote}"
              </p>
              <footer className="text-right">
                <cite className="text-muted-foreground not-italic">
                  — {quote.author}
                </cite>
              </footer>
            </blockquote>
          </div>
        </section>
      )}
    </div>
  );
}
