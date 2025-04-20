"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { storyService } from "@/lib/services/storyService";
import { Story } from "@/lib/types/Story";
import { BookOpen, BookMarked, Users } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStories: 0,
    beginnerStories: 0,
    intermediateStories: 0,
    advancedStories: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stories = await storyService.getAllStories();
        setStats({
          totalStories: stories.length,
          beginnerStories: stories.filter((s) => s.level === "beginner").length,
          intermediateStories: stories.filter((s) => s.level === "intermediate")
            .length,
          advancedStories: stories.filter((s) => s.level === "advanced").length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your language learning platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Beginner Level
            </CardTitle>
            <BookMarked className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.beginnerStories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Intermediate Level
            </CardTitle>
            <BookMarked className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.intermediateStories}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Advanced Level
            </CardTitle>
            <BookMarked className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.advancedStories}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentStories />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentStories() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const allStories = await storyService.getAllStories();
        setStories(allStories.slice(0, 5)); // Son 5 hikaye
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <div
          key={story.id}
          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
        >
          <div>
            <p className="font-medium">{story.title}</p>
            <p className="text-sm text-muted-foreground">
              Language: {story.original_language.toUpperCase()}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              story.level === "beginner"
                ? "bg-green-100 text-green-800"
                : story.level === "intermediate"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {story.level}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="space-y-4">
      <a
        href="/admin/stories/create"
        className="flex items-center space-x-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        <BookOpen className="h-5 w-5" />
        <span>Add New Story</span>
      </a>
      <a
        href="/admin/stories"
        className="flex items-center space-x-3 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
      >
        <Users className="h-5 w-5" />
        <span>Manage Stories</span>
      </a>
    </div>
  );
}
