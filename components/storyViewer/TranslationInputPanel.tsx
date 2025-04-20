"use client";

import type React from "react";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import {
  Languages,
  History,
  ChevronDown,
  Check,
  Trash2,
  Save,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import type { TranslationDraft } from "@/lib/types/TranslationDraft";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Label } from "@/components/ui/Label";
import { storyViewerService } from "@/lib/services/storyViewerService";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/UseToast";
import { SUPPORTED_LANGUAGES } from "@/lib/types/SupportedLanguages";

// Function to debounce requests
const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

interface TranslationInputPanelProps {
  userTranslation: string;
  translationLanguage: string;
  isLoading: boolean;
  isSaving: boolean;
  isLoadingDrafts: boolean;
  translationDrafts: TranslationDraft[];
  selectedLanguage: string;
  setUserTranslation: (value: string) => void;
  handleTranslationLanguageChange: (language: string) => void;
  handleShowTranslation: () => void;
  saveTranslation: () => void;
  loadDraft: (draftId: string) => void;
  loadTranslationDrafts: () => void;
  getAvailableTranslationLanguages: () => { code: string; name: string }[];
  story: any;
  getUserId: () => Promise<string>;
}

// Add this helper function to get the current language name
const getLanguageName = (
  code: string,
  availableLanguages: { code: string; name: string }[]
) => {
  // First try to find in available languages
  const availableLanguage = availableLanguages.find(
    (lang) => lang.code === code
  );

  if (availableLanguage) {
    return availableLanguage.name;
  }

  // If not found, look in all supported languages
  const allLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);

  return allLanguage?.name || code.toUpperCase();
};

export function TranslationInputPanel({
  userTranslation,
  translationLanguage,
  isLoading,
  isSaving,
  isLoadingDrafts,
  translationDrafts,
  selectedLanguage,
  setUserTranslation,
  handleTranslationLanguageChange,
  handleShowTranslation,
  saveTranslation,
  loadDraft,
  loadTranslationDrafts,
  getAvailableTranslationLanguages,
  story,
  getUserId,
}: TranslationInputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // AI mode states
  const [isAIModeEnabled, setIsAIModeEnabled] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [assessmentFeedback, setAssessmentFeedback] = useState("");
  const [alternativeTranslations, setAlternativeTranslations] = useState<
    string[]
  >([]);
  const [hasImprovedTranslation, setHasImprovedTranslation] = useState(false);
  const [improvedTranslation, setImprovedTranslation] = useState<string | null>(
    null
  );
  const [isAssessing, setIsAssessing] = useState(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [lastAssessedText, setLastAssessedText] = useState("");

  // Draft management
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [isDraftDeleting, setIsDraftDeleting] = useState(false);

  // Assess translation with debouncing
  const assessTranslation = useCallback(
    debounce(async (text: string) => {
      if (!isAIModeEnabled || !text.trim() || text === lastAssessedText) {
        return;
      }

      // Check if text ends with a punctuation that suggests a complete thought
      // (period, question mark, exclamation mark, or comma)
      const endsWithCompleteSentence = /[.!?,]$/.test(text.trim());

      // Only proceed if the text ends with appropriate punctuation
      // or if it's significantly different from the last assessed text
      const significantChange =
        lastAssessedText &&
        (text.length - lastAssessedText.length > 15 ||
          text.length < lastAssessedText.length);

      if (!endsWithCompleteSentence && !significantChange) {
        return;
      }

      // Additional check for completeness - compare with original text
      // If the user has written very little compared to the original text's first sentence
      // then don't do assessment to avoid premature suggestions
      const originalFirstSentence =
        story.original_story.split(/[.!?]/)[0] || "";
      const isTooShort =
        text.length < 10 ||
        (originalFirstSentence.length > 0 &&
          text.length < originalFirstSentence.length * 0.4);

      if (isTooShort) {
        console.log("Translation too short for assessment");
        return;
      }

      setIsAssessing(true);
      try {
        const result = await storyViewerService.assessTranslation(
          story.original_story,
          text,
          story.original_language,
          translationLanguage
        );

        setAssessmentScore(result.score);
        setAssessmentFeedback(result.feedback);

        // Only apply suggested translation if we have a complete sentence
        // and the suggestion isn't much longer than what the user wrote
        if (result.new_translate && result.translation) {
          const hasComplete = endsWithCompleteSentence || text.includes(".");
          const isReasonableLength =
            result.translation.length <= text.length * 1.5;

          setHasImprovedTranslation(hasComplete && isReasonableLength);
          setImprovedTranslation(result.translation);
        } else {
          setHasImprovedTranslation(false);
          setImprovedTranslation(null);
        }

        setLastAssessedText(text);
      } catch (error) {
        console.error("Error assessing translation:", error);
        toast({
          title: "Error",
          description: "Failed to assess translation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAssessing(false);
      }
    }, 1000),
    [isAIModeEnabled, story, translationLanguage, lastAssessedText, toast]
  );

  // Update userTranslation state and conditionally trigger assessment
  const handleTranslationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newText = e.target.value;
    setUserTranslation(newText);

    // If AI mode is enabled and we have a significant text,
    // consider assessment when ending a sentence or phrase
    if (isAIModeEnabled && newText.trim()) {
      // Check if the last character typed was a punctuation that completes a thought
      const lastChar = newText.slice(-1);
      if ([".", "!", "?", ","].includes(lastChar)) {
        assessTranslation(newText);
      }
    }
  };

  // Generate alternative translations
  const generateAlternatives = async () => {
    if (!userTranslation.trim()) return;

    // Check if the translation is complete enough for alternatives
    const endsWithPunctuation = /[.!?]$/.test(userTranslation.trim());
    const hasCompleteSentence =
      userTranslation.includes(".") ||
      userTranslation.includes("!") ||
      userTranslation.includes("?");

    // If translation doesn't appear to be a complete sentence,
    // inform the user instead of generating potentially misleading alternatives
    if (!endsWithPunctuation && !hasCompleteSentence) {
      toast({
        title: "Incomplete Translation",
        description:
          "Please complete at least one full sentence ending with a period, question mark, or exclamation point before requesting alternatives.",
        duration: 5000,
      });
      return;
    }

    setIsLoadingAlternatives(true);
    try {
      const alternatives = await storyViewerService.getAlternativeTranslations(
        story.original_story,
        userTranslation,
        story.original_language,
        translationLanguage
      );

      setAlternativeTranslations(alternatives);

      // If no alternatives were found, inform the user
      if (alternatives.length === 0) {
        toast({
          title: "No Alternatives Available",
          description:
            "Our AI couldn't generate good alternatives for your translation. This could be because your translation is already good or the text is too short.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error generating alternatives:", error);
      toast({
        title: "Error",
        description: "Failed to generate alternative translations.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  // AI mode toggle handler
  const handleAIModeToggle = (enabled: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to use AI mode.",
        variant: "destructive",
      });
      return;
    }

    setIsAIModeEnabled(enabled);

    if (enabled) {
      // Show information about auto-assessment behavior
      toast({
        title: "AI Mode Enabled",
        description:
          "Translations will be automatically assessed after you type a period, comma, question mark, or exclamation mark.",
        duration: 1300,
      });

      // Check if there's content with punctuation marks that can be assessed
      const hasPunctuation = /[.!?,]/.test(userTranslation);
      const hasCompleteSentence =
        userTranslation.includes(".") ||
        userTranslation.includes("!") ||
        userTranslation.includes("?");

      // If there's content with punctuation, trigger assessment directly (bypassing debounce)
      if (userTranslation.trim() && (hasPunctuation || hasCompleteSentence)) {
        // Using setTimeout to ensure state update has completed
        setTimeout(() => {
          runImmediateAssessment(userTranslation);
        }, 100);
        setAlternativeTranslations([]);
      }
    }
  };

  // Function for immediate assessment without debounce
  const runImmediateAssessment = async (text: string) => {
    if (!text.trim()) return;

    setIsAssessing(true);
    try {
      const result = await storyViewerService.assessTranslation(
        story.original_story,
        text,
        story.original_language,
        translationLanguage
      );

      setAssessmentScore(result.score);
      setAssessmentFeedback(result.feedback);

      // Only apply suggested translation if we have a complete sentence
      // and the suggestion isn't much longer than what the user wrote
      if (result.new_translate && result.translation) {
        const endsWithCompleteSentence = /[.!?,]$/.test(text.trim());
        const hasComplete = endsWithCompleteSentence || text.includes(".");
        const isReasonableLength =
          result.translation.length <= text.length * 1.5;

        setHasImprovedTranslation(hasComplete && isReasonableLength);
        setImprovedTranslation(result.translation);
      } else {
        setHasImprovedTranslation(false);
        setImprovedTranslation(null);
      }

      setLastAssessedText(text);
    } catch (error) {
      console.error("Error assessing translation:", error);
      toast({
        title: "Error",
        description: "Failed to assess translation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssessing(false);
    }
  };

  // Apply an alternative translation
  const handleApplyAlternative = (alternative: string) => {
    setUserTranslation(alternative);
    setLastAssessedText(alternative);
  };

  // Apply improved translation
  const handleApplyImprovedTranslation = () => {
    if (improvedTranslation) {
      setUserTranslation(improvedTranslation);
      setLastAssessedText(improvedTranslation);
      setHasImprovedTranslation(false);

      toast({
        title: "Translation Applied",
        description: "The suggested translation has been applied.",
      });
    }
  };

  // Draft deletion handlers
  const handleDraftDeleteClick = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    setDraftToDelete(draftId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;

    try {
      setIsDraftDeleting(true);
      const userId = await getUserId();
      storyViewerService.deleteDraft(draftToDelete, story.id, userId);
    } catch (error) {
      console.error("Error deleting draft:", error);
    } finally {
      setIsDraftDeleting(false);
      setIsDeleteDialogOpen(false);
      setDraftToDelete(null);
      loadTranslationDrafts();
    }
  };

  // Manually refresh assessment - use immediate assessment
  const handleRefreshAssessment = () => {
    if (userTranslation.trim()) {
      // Force assessment regardless of punctuation
      runImmediateAssessment(userTranslation);
    }
  };

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gradient-to-br from-gray-400 to-violet-300 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-violet-200/50 hover:shadow-violet-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)]">
            Your Translation
          </h3>
          <Badge
            variant="outline"
            className="cursor-default pl-3 py-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm border-white/40 text-white"
          >
            {getLanguageName(
              translationLanguage,
              getAvailableTranslationLanguages()
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-4 bg-white/30 rounded-full px-3 py-1">
            <div className="flex items-center gap-2 mr-3">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <Label htmlFor="ai-mode" className="text-white font-semibold">
                AI Mode
              </Label>
            </div>
            <Switch
              id="ai-mode"
              checked={isAIModeEnabled}
              onCheckedChange={handleAIModeToggle}
              disabled={!user}
            />
          </div>
          <Button variant="outline" onClick={handleShowTranslation}>
            <Languages className="mr-2 h-4 w-4" />
            Show Translation
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-pulse flex flex-col items-center">
            <Languages className="h-8 w-8 text-primary mb-2" />
            <p>Loading your translation...</p>
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full h-[400px] p-4 bg-white/70 border rounded-lg resize-none focus:ring-1 focus:ring-white focus:outline-none leading-relaxed"
          placeholder="Write your translation here..."
          value={userTranslation}
          onChange={handleTranslationChange}
        />
      )}

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isAIModeEnabled={isAIModeEnabled}
        score={assessmentScore}
        feedback={assessmentFeedback}
        alternativeTranslations={alternativeTranslations}
        isAssessing={isAssessing}
        isLoadingAlternatives={isLoadingAlternatives}
        hasImprovedTranslation={hasImprovedTranslation}
        improvedTranslation={improvedTranslation}
        userTranslation={userTranslation}
        onApplyAlternative={handleApplyAlternative}
        onApplyImprovedTranslation={handleApplyImprovedTranslation}
        onRefreshAssessment={handleRefreshAssessment}
        onRefreshAlternatives={generateAlternatives}
      />

      <div className="mt-4 flex justify-end gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Translation History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] mt-4">
              {isLoadingDrafts ? (
                <div className="flex justify-center items-center h-[300px]">
                  <div className="animate-pulse flex flex-col items-center">
                    <History className="h-8 w-8 text-primary mb-2" />
                    <p>Loading your translation history...</p>
                  </div>
                </div>
              ) : translationDrafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No translation history found</p>
                  <p className="text-sm mt-2">
                    Save a translation to see it here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {translationDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => loadDraft(draft.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(draft.date).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDraftDeleteClick(e, draft.id)}
                          aria-label="Delete Draft"
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm line-clamp-2">{draft.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Button
          variant={"default"}
          onClick={saveTranslation}
          disabled={isSaving || !userTranslation.trim()}
          className="hover-lift"
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Translation
            </>
          )}
        </Button>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Draft will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDraftDeleting}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDraftDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDraftDeleting ? "Deleting..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
