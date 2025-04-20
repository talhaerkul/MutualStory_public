"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import type { StoryCardProps } from "@/lib/types/StoryCardProps";
import { dateHelper } from "@/lib/dateHelper";
import { storyService } from "@/lib/services/storyService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function StoryCard({
  id,
  title,
  description,
  level,
  original_language,
  createdAt,
  initialFavorited = false,
}: StoryCardProps & { initialFavorited?: boolean }) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const levelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card link click
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }

    try {
      setIsLoading(true);
      const isNowFavorited = await storyService.toggleFavorite(id);
      setIsFavorited(isNowFavorited);
      toast.success(
        isNowFavorited ? "Added to favorites" : "Removed from favorites"
      );
    } catch (error) {
      toast.error("Failed to update favorite");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex-none pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl leading-tight">{title}</CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    isFavorited ? "text-yellow-500" : "text-muted-foreground"
                  } hover:text-yellow-500`}
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                >
                  <Star
                    className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`}
                  />
                  <span className="sr-only">
                    {isFavorited ? "Remove from favorites" : "Add to favorites"}
                  </span>
                </Button>
              )}
              <Badge className={`${levelColors[level]} whitespace-nowrap`}>
                {level}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-6">
        <p className="text-muted-foreground line-clamp-3">{description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="whitespace-nowrap">
            {original_language.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Added {dateHelper.formatDate(createdAt)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex-none pt-4 border-t">
        <div className="w-full flex justify-end">
          <Button asChild>
            <Link href={`/story/${id}`}>Read Story</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
