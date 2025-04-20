"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Languages, ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";

interface TranslationViewPanelProps {
  translationLanguage: string;
  translationContent: string;
  isLoadingTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
  handleTranslationLanguageChange: (language: string) => void;
  getAvailableTranslationLanguages: () => { code: string; name: string }[];
}

export function TranslationViewPanel({
  translationLanguage,
  translationContent,
  isLoadingTranslation,
  setShowTranslation,
  handleTranslationLanguageChange,
  getAvailableTranslationLanguages,
}: TranslationViewPanelProps) {
  // Find language name from available languages or all supported languages
  const getCurrentLanguageName = () => {
    // First try to find in available languages
    const availableLanguage = getAvailableTranslationLanguages().find(
      (lang) => lang.code === translationLanguage
    );

    if (availableLanguage) {
      return availableLanguage.name;
    }

    // If not found, look in all supported languages
    const allLanguage = SUPPORTED_LANGUAGES.find(
      (lang) => lang.code === translationLanguage
    );

    return allLanguage?.name || translationLanguage.toUpperCase();
  };

  return (
    <motion.div
      key="translation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gradient-to-br from-pink-400 to-violet-300 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-orange-200/50 hover:shadow-orange-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)]">
            Translation
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer transition-all duration-200 pl-3 py-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/40 text-white"
              >
                {getCurrentLanguageName()}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2">
              <div className="grid gap-1">
                {getAvailableTranslationLanguages().map((language) => (
                  <Button
                    key={language.code}
                    variant={
                      translationLanguage === language.code
                        ? "secondary"
                        : "ghost"
                    }
                    className="justify-start font-normal"
                    onClick={() =>
                      handleTranslationLanguageChange(language.code)
                    }
                  >
                    {language.name}
                    {translationLanguage === language.code && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowTranslation(false)}
          className="bg-white/70 hover:bg-white/90 border-orange-400/20 hover:border-orange-400/40 shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5"
        >
          <Languages className="mr-2 h-4 w-4 " />
          <span className="font-medium">Hide Translation</span>
        </Button>
      </div>

      <div className="prose max-w-none min-h-[400px]">
        {isLoadingTranslation ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-pulse flex flex-col items-center">
              <Languages className="h-8 w-8 text-primary mb-2 animate-spin" />
              <p className="text-primary/70 font-medium">
                Loading translation...
              </p>
            </div>
          </div>
        ) : (
          <div className="text-black text-lg leading-relaxed">
            {translationContent ||
              "Translation not available for this language"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
