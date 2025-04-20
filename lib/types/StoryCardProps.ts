export interface StoryCardProps {
  id: string;
  title: string;
  description: string;
  original_language: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
}
