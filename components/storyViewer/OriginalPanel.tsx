"use client";

import type React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { type RefObject } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";
import { type StoryLevel } from "@/lib/types/StoryLevel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface OriginalPanelProps {
  story: any;
  selectedLanguage: string;
  originalContent: string;
  isLoadingOriginal: boolean;
  selectedWordPositions: {
    word: string;
    position: { x: number; y: number };
    index: number;
  }[];
  originalLanguageRef: RefObject<string>;
  handleLanguageChange: (language: string) => void;
  handleWordClick: (
    word: string,
    position: { x: number; y: number },
    index: number
  ) => void;
}

export function OriginalPanel({
  story,
  selectedLanguage,
  originalContent,
  isLoadingOriginal,
  selectedWordPositions,
  originalLanguageRef,
  handleLanguageChange,
  handleWordClick,
}: OriginalPanelProps) {
  const handleClick = (
    word: string,
    index: number,
    event: React.MouseEvent
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    };
    handleWordClick(word, position, index);
  };

  return (
    <div className="bg-gradient-to-br from-red-400 to-orange-200 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-200/50 hover:shadow-orange-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold relative text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)]">
            {story.title}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer transition-all duration-200 pl-3 py-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/40 text-white"
              >
                {SUPPORTED_LANGUAGES.find(
                  (lang) => lang.code === selectedLanguage
                )?.name || selectedLanguage.toUpperCase()}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2">
              <div className="grid gap-1">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <Button
                    key={language.code}
                    variant={
                      selectedLanguage === language.code ? "secondary" : "ghost"
                    }
                    className="justify-start font-normal"
                    onClick={() => handleLanguageChange(language.code)}
                  >
                    {language.name}
                    {selectedLanguage === language.code && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={"outline"}
                className={cn(
                  "px-3 py-1.5 font-semibold rounded-md",
                  story.level === "beginner"
                    ? "bg-green-100 text-green-800"
                    : story.level === "intermediate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {story.level}
              </Badge>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLanguage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="prose max-w-none"
        >
          {isLoadingOriginal ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-pulse flex flex-col items-center">
                <Languages className="h-8 w-8 text-primary mb-2" />
                <p>Loading translation...</p>
              </div>
            </div>
          ) : (
            <div className="text-lg leading-relaxed">
              {(selectedLanguage === originalLanguageRef.current
                ? story.original_story
                : originalContent
              )
                .split(/\s+/)
                .map((word: string, index: number) => (
                  <span
                    key={`${word}-${index}`}
                    onClick={(e) => handleClick(word, index, e)}
                    className={`inline-block cursor-pointer rounded px-1 py-0.5 transition-colors ${
                      selectedWordPositions.some(
                        (wp) => wp.word === word && wp.index === index
                      )
                        ? "text-white"
                        : "hover:bg-orange-100 text-black"
                    }`}
                  >
                    {word}{" "}
                  </span>
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
