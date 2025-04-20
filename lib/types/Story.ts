import { StoryLevel } from "./StoryLevel";
import { TranslationUpdate } from "./TranslationUpdate";

export type Story = {
  id: string;
  title: string;
  original_story: string;
  original_language: string;
  level: StoryLevel;
  createdAt: string | number;
  updatedAt: string;
  translations?: TranslationUpdate;
};
