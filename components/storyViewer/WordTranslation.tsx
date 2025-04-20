"use client";

import { X } from "lucide-react";
import { motion, useDragControls } from "framer-motion";
import { useEffect, useState } from "react";

interface WordTranslationProps {
  wordTranslation: {
    original: string;
    translated: string;
  };
  setSelectedWords: (words: string[]) => void;
  setSelectedWordPositions: React.Dispatch<
    React.SetStateAction<
      Array<{
        word: string;
        position: { x: number; y: number };
        index: number;
      }>
    >
  >;
  selectedWordPosition?: { x: number; y: number };
}

export function WordTranslation({
  wordTranslation,
  setSelectedWords,
  setSelectedWordPositions,
  selectedWordPosition,
}: WordTranslationProps) {
  const dragControls = useDragControls();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedWordPosition) {
      setPosition({
        x: selectedWordPosition.x,
        y: selectedWordPosition.y + 30, // 30px below the word
      });
    } else {
      // Fallback position in the center of the viewport if no position is provided
      setPosition({
        x: window.innerWidth / 2 - 128, // Half the width of the component (256px/2)
        y: window.innerHeight / 2 - 50, // Approximate half height
      });
    }
  }, [selectedWordPosition]);

  // Log to help with debugging
  useEffect(() => {
    console.log("WordTranslation rendered", {
      wordTranslation,
      position,
      selectedWordPosition,
    });
  }, [wordTranslation, position, selectedWordPosition]);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[100] w-64 p-4 bg-white/90 rounded-lg shadow-lg border border-orange-600"
      style={{
        pointerEvents: "auto",
        top: 0,
        left: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <button
        onClick={() => {
          setSelectedWords([]);
          setSelectedWordPositions([]);
        }}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
        aria-label="Close translation"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      <p className="font-semibold leading-relaxed">
        {wordTranslation.translated}
      </p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {wordTranslation.original}
      </p>
    </motion.div>
  );
}
