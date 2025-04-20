import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import {
  Check,
  RefreshCw,
  Lightbulb,
  XCircle,
  Award,
  Wand2,
  Info,
} from "lucide-react";

interface AIAssistantPanelProps {
  isAIModeEnabled: boolean;
  score: number;
  feedback: string;
  alternativeTranslations: string[];
  isAssessing: boolean;
  isLoadingAlternatives: boolean;
  hasImprovedTranslation: boolean;
  improvedTranslation: string | null;
  userTranslation: string;
  onApplyAlternative: (alternative: string) => void;
  onApplyImprovedTranslation: () => void;
  onRefreshAssessment?: () => void;
  onRefreshAlternatives: () => void;
}

export function AIAssistantPanel({
  isAIModeEnabled,
  score,
  feedback,
  alternativeTranslations,
  isAssessing,
  isLoadingAlternatives,
  hasImprovedTranslation,
  improvedTranslation,
  userTranslation,
  onApplyAlternative,
  onApplyImprovedTranslation,
  onRefreshAssessment,
  onRefreshAlternatives,
}: AIAssistantPanelProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!isAIModeEnabled) return null;

  // Determine score color
  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // Determine score badge variant
  const getScoreBadgeVariant = ():
    | "default"
    | "destructive"
    | "outline"
    | "secondary" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  // Check if user's translation appears to be incomplete
  const isTranslationIncomplete = (): boolean => {
    const text = userTranslation.trim();
    return text.length === 0 || !/[.!?]/.test(text);
  };

  return (
    <div className="mt-4 space-y-2">
      <Card className="p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium">AI Translation Assistant</h3>
          </div>
        </div>

        {isAssessing ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Assessing your translation...
            </p>
            <Progress value={45} className="h-2" />
          </div>
        ) : isTranslationIncomplete() ? (
          <div className="p-3 bg-muted/30 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium mb-1">
                Complete a sentence to get feedback
              </h4>
              <p className="text-xs text-muted-foreground">
                Finish at least one sentence ending with a period, question
                mark, or exclamation point for AI assessment.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-2">
              <Badge
                variant={getScoreBadgeVariant()}
                className="text-lg px-3 py-1"
              >
                {score}/100
              </Badge>
              <Progress value={score} className="h-2 flex-1" />
            </div>

            <p className="text-sm">{feedback}</p>

            {hasImprovedTranslation && improvedTranslation && (
              <div className="mt-3 p-3 bg-muted/30 rounded-md border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Suggested Translation</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={onApplyImprovedTranslation}
                  >
                    <Wand2 className="h-4 w-4 mr-1 text-indigo-500" />
                    Apply
                  </Button>
                </div>
                <p className="text-sm italic">{improvedTranslation}</p>
              </div>
            )}

            <div className="mt-3">
              <Popover
                open={showAlternatives}
                onOpenChange={setShowAlternatives}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      !alternativeTranslations.length && onRefreshAlternatives()
                    }
                    disabled={
                      isLoadingAlternatives || isTranslationIncomplete()
                    }
                  >
                    {isLoadingAlternatives ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    )}
                    View Alternative Translations
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="center">
                  <div className="p-2 border-b">
                    <h4 className="font-medium">Alternative Translations</h4>
                    <p className="text-xs text-muted-foreground">
                      Click on any alternative to apply it to your translation
                    </p>
                  </div>

                  {alternativeTranslations.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {alternativeTranslations.map((alt, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-3 hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-b-0 group"
                          onClick={() => {
                            onApplyAlternative(alt);
                            setShowAlternatives(false);
                          }}
                        >
                          <Check className="h-4 w-4 mt-1 text-green-500 opacity-0 group-hover:opacity-100" />
                          <span>{alt}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>No alternatives available</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={onRefreshAlternatives}
                        disabled={
                          isLoadingAlternatives || isTranslationIncomplete()
                        }
                      >
                        {isLoadingAlternatives ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Generate Alternatives
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
