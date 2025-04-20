"use client";

import { useState, useEffect, useRef } from "react";
import { StoryViewerProps } from "@/lib/types/StoryViewerProps";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { storyViewerService } from "@/lib/services/storyViewerService";
import { TranslationDraft } from "@/lib/types/TranslationDraft";
import { useToast } from "@/components/ui/UseToast";
import { OriginalPanel } from "./OriginalPanel";
import { TranslationInputPanel } from "./TranslationInputPanel";
import { TranslationViewPanel } from "./TranslationViewPanel";
import { WordTranslation } from "./WordTranslation";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";

export default function StoryViewer({ story, translation }: StoryViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Original panel states
  const [selectedLanguage, setSelectedLanguage] = useState(
    story.original_language
  );
  const [originalContent, setOriginalContent] = useState(story.original_story);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordTranslation, setWordTranslation] = useState<{
    original: string;
    translated: string;
  } | null>(null);
  const [selectedWordPositions, setSelectedWordPositions] = useState<
    {
      word: string;
      position: { x: number; y: number };
      index: number;
    }[]
  >([]);

  // Translation panel states
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState("en");
  const [translationContent, setTranslationContent] = useState(
    translation?.story || ""
  );
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  // User translation states
  const [userTranslation, setUserTranslation] = useState("");
  const [translationDrafts, setTranslationDrafts] = useState<
    TranslationDraft[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const originalLanguageRef = useRef<string>(story.original_language);

  // Get user ID (authenticated or anonymous)
  const getUserId = async () => {
    let clientIp = "127.0.0.1";
    async function fetchIP() {
      try {
        // ipify API kullanımı
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        clientIp = data.ip;
        console.log(clientIp);
      } catch (error) {
        console.error("IP adresi alınamadı:", error);
      }
    }
    await fetchIP();
    return user?.email || storyViewerService.getUserId(clientIp);
  };

  // Get user's preferred language (fallback to English)
  const getUserLanguage = () => {
    return navigator.language.split("-")[0] || "en";
  };

  // Load user's previous translation on mount
  useEffect(() => {
    loadTranslationDrafts();

    // Initialize translation language to user's preferred language if not the same as original
    const userLang = getUserLanguage();
    if (userLang !== story.original_language) {
      setTranslationLanguage(userLang);
    } else {
      // Find first available language that's not the original
      const availableLang = SUPPORTED_LANGUAGES.find(
        (lang) => lang.code !== story.original_language
      );
      if (availableLang) {
        setTranslationLanguage(availableLang.code);
      }
    }
  }, [story.id, user]);

  // Update word translation when selected words change
  useEffect(() => {
    if (selectedWords.length > 0) {
      translateSelectedWords();
    } else {
      setWordTranslation(null);
    }
  }, [selectedWords, translationLanguage]);

  // Load user's translation drafts
  const loadTranslationDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const userId = await getUserId();
      const drafts = await storyViewerService.getTranslationDrafts(
        story.id,
        userId
      );
      setTranslationDrafts(drafts);
      setUserTranslation(drafts[0]?.content || "");
    } catch (error) {
      console.error("Error loading translation drafts:", error);
      toast({
        title: "Error",
        description: "Failed to load your translation history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Save translation
  const saveTranslation = async () => {
    if (!userTranslation.trim()) return;

    setIsSaving(true);
    try {
      const userId = await getUserId();
      await storyViewerService.saveTranslationDraft({
        storyId: story.id,
        userId,
        content: userTranslation,
        language: translationLanguage,
        date: new Date().toISOString(),
      });

      // Refresh drafts list
      await loadTranslationDrafts();

      toast({
        title: "Success",
        description: "Your translation has been saved.",
      });
    } catch (error) {
      console.error("Error saving translation:", error);
      toast({
        title: "Error",
        description: "Failed to save your translation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle original language change
  const handleLanguageChange = (language: string) => {
    if (language === selectedLanguage) return;

    setSelectedLanguage(language);

    if (language === originalLanguageRef.current) {
      // If switching to original language, just show the original story
      setOriginalContent(story.original_story);
    } else {
      // If switching to a non-original language, load that translation
      setIsLoadingOriginal(true);
      storyViewerService
        .getTranslation(story.id, language)
        .then((translationData) => {
          if (translationData) {
            setOriginalContent(translationData.story);
          } else {
            setOriginalContent("Translation not available for this language");
          }
        })
        .catch((error) => {
          console.error("Error loading translation:", error);
          setOriginalContent("Error loading translation");
          toast({
            title: "Error",
            description: "Failed to load translation. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingOriginal(false);
        });
    }

    // If translation language is now the same as selected language, change it
    if (translationLanguage === language) {
      const userLang = getUserLanguage();
      if (userLang !== language) {
        handleTranslationLanguageChange(userLang);
      } else {
        // Find first available language that's not the selected
        const availableLang = SUPPORTED_LANGUAGES.find(
          (lang) => lang.code !== language
        );
        if (availableLang) {
          handleTranslationLanguageChange(availableLang.code);
        }
      }
    }
  };

  // Handle translation language change
  const handleTranslationLanguageChange = (language: string) => {
    if (language === selectedLanguage) {
      // Don't allow setting translation language to the same as original
      return;
    }

    setTranslationLanguage(language);

    // Only load the translation if we're currently showing the translation panel
    if (showTranslation) {
      loadTranslationContent(language);
    }
  };

  // Load translation content for the translation panel
  const loadTranslationContent = (language: string) => {
    setIsLoadingTranslation(true);
    storyViewerService
      .getTranslation(story.id, language)
      .then((translationData) => {
        if (translationData) {
          setTranslationContent(translationData.story);
        } else {
          setTranslationContent(story.original_story);
        }
      })
      .catch((error) => {
        console.error("Error loading translation:", error);
        setTranslationContent("Error loading translation");
        toast({
          title: "Error",
          description: "Failed to load translation. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingTranslation(false);
      });
  };

  // Handle showing translation with current language
  const handleShowTranslation = () => {
    loadTranslationContent(translationLanguage);
    setShowTranslation(true);
  };

  const handleWordClick = (
    word: string,
    position: { x: number; y: number },
    index: number
  ) => {
    if (!user) {
      toast({
        title: "Login Required!",
        description: "You should login to use translate by word feature.",
        variant: "default",
      });
    } else {
      // Check if this specific instance is already selected
      const isSelected = selectedWordPositions.some(
        (wp) => wp.word === word && wp.index === index
      );

      if (isSelected) {
        // Remove only this specific instance
        setSelectedWordPositions(
          selectedWordPositions.filter(
            (wp) => !(wp.word === word && wp.index === index)
          )
        );

        // If this was the last instance of this word, remove it from selectedWords
        const remainingInstances = selectedWordPositions.filter(
          (wp) => wp.word === word && wp.index !== index
        );

        if (remainingInstances.length === 0) {
          setSelectedWords(selectedWords.filter((w) => w !== word));
        }
      } else {
        // Add this specific instance
        setSelectedWordPositions([
          ...selectedWordPositions,
          { word, position, index },
        ]);

        // Only add to selectedWords if not already there
        if (!selectedWords.includes(word)) {
          setSelectedWords([...selectedWords, word]);
        }
      }
    }
  };

  // Translate selected words
  const translateSelectedWords = async () => {
    if (selectedWords.length === 0) return;

    try {
      // Sort words by their appearance in the text
      const sortedWords = [...selectedWordPositions]
        .sort((a, b) => a.index - b.index)
        .map((wp) => wp.word);

      const result = await storyViewerService.translateWords(
        sortedWords.join(" "),
        selectedLanguage,
        translationLanguage
      );

      setWordTranslation({
        original: sortedWords.join(" "),
        translated: result.translated,
      });
    } catch (error) {
      setWordTranslation({
        original: selectedWords.join(" "),
        translated: "Error translating text",
      });
    }
  };

  // Load a specific draft
  const loadDraft = async (draftId: string) => {
    try {
      const userId = await getUserId();
      const draft = await storyViewerService.getDraft(
        draftId,
        story.id,
        userId
      );

      if (draft) {
        setUserTranslation(draft.content);
        // If the draft has a different language, update the translation language
        if (
          draft.language &&
          draft.language !== translationLanguage &&
          draft.language !== selectedLanguage
        ) {
          setTranslationLanguage(draft.language);
        }

        toast({
          title: "Draft loaded",
          description: `Loaded draft from ${new Date(
            draft.date
          ).toLocaleString()}`,
        });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast({
        title: "Error",
        description: "Failed to load the selected draft.",
        variant: "destructive",
      });
    }
  };

  // Get available translation languages (excluding the original language)
  const getAvailableTranslationLanguages = () => {
    return SUPPORTED_LANGUAGES.filter((lang) => lang.code !== selectedLanguage);
  };

  return (
    <div className="space-y-8 max-w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Story Side */}
        <OriginalPanel
          story={story}
          selectedLanguage={selectedLanguage}
          originalContent={originalContent}
          isLoadingOriginal={isLoadingOriginal}
          selectedWordPositions={selectedWordPositions}
          originalLanguageRef={originalLanguageRef}
          handleLanguageChange={handleLanguageChange}
          handleWordClick={handleWordClick}
        />

        {/* Translation Side */}
        <div>
          <AnimatePresence mode="wait">
            {!showTranslation ? (
              <TranslationInputPanel
                userTranslation={userTranslation}
                translationLanguage={translationLanguage}
                isLoading={isLoading}
                isSaving={isSaving}
                isLoadingDrafts={isLoadingDrafts}
                translationDrafts={translationDrafts}
                selectedLanguage={selectedLanguage}
                setUserTranslation={setUserTranslation}
                handleTranslationLanguageChange={
                  handleTranslationLanguageChange
                }
                handleShowTranslation={handleShowTranslation}
                saveTranslation={saveTranslation}
                loadDraft={loadDraft}
                loadTranslationDrafts={loadTranslationDrafts}
                getAvailableTranslationLanguages={
                  getAvailableTranslationLanguages
                }
                story={story}
                getUserId={getUserId}
              />
            ) : (
              <TranslationViewPanel
                translationLanguage={translationLanguage}
                translationContent={translationContent}
                isLoadingTranslation={isLoadingTranslation}
                setShowTranslation={setShowTranslation}
                handleTranslationLanguageChange={
                  handleTranslationLanguageChange
                }
                getAvailableTranslationLanguages={
                  getAvailableTranslationLanguages
                }
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Word Translation */}
      {selectedWords.length > 0 && wordTranslation && (
        <WordTranslation
          wordTranslation={wordTranslation}
          setSelectedWords={setSelectedWords}
          setSelectedWordPositions={setSelectedWordPositions}
          selectedWordPosition={
            selectedWordPositions[selectedWordPositions.length - 1]?.position
          }
        />
      )}
    </div>
  );
}
