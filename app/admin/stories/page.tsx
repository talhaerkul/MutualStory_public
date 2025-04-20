"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Story } from "@/lib/types/Story";
import { storyService } from "@/lib/services/storyService";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await storyService.getAllStories();
      setStories(data);
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        await storyService.deleteStory(id);
        await loadStories();
      } catch (error) {
        console.error("Error deleting story:", error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
          <p className="text-muted-foreground">Manage your stories here</p>
        </div>
        <Link href="/admin/stories/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Story
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((story) => (
              <TableRow key={story.id}>
                <TableCell className="font-medium">{story.title}</TableCell>
                <TableCell>{story.original_language.toUpperCase()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      story.level === "beginner"
                        ? "bg-green-100 text-green-800"
                        : story.level === "intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {story.level}
                  </span>
                </TableCell>
                <TableCell>{formatDate(story.createdAt as string)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/stories/edit/${story.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(story.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
