"use client";

import { useState, useEffect, useRef } from "react";
import { contentService } from "@/lib/services/contentService";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Textarea } from "@/components/ui/TextArea";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { toast } from "sonner";
import { Loader2, QuoteIcon, Pencil } from "lucide-react";
import { Quote } from "@/lib/types/Quote";

const emptyQuote: Omit<Quote, "id" | "createdAt"> = {
  quote: "",
  author: "",
  isActive: false,
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyQuote);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await contentService.getAllQuotes();
      setQuotes(data);
    } catch (error) {
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await contentService.updateQuote(editingId, formData);
        toast.success("Quote updated successfully");
      } else {
        await contentService.createQuote(formData);
        toast.success("Quote created successfully");
      }
      setFormData(emptyQuote);
      setEditingId(null);
      loadQuotes();
    } catch (error) {
      toast.error(
        editingId ? "Failed to update quote" : "Failed to create quote"
      );
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingId(quote.id!);
    setFormData({
      quote: quote.quote,
      author: quote.author,
      isActive: quote.isActive,
    });

    // Smooth scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyQuote);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    try {
      await contentService.deleteQuote(id);
      toast.success("Quote deleted successfully");
      loadQuotes();
    } catch (error) {
      toast.error("Failed to delete quote");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await contentService.updateQuote(id, { isActive: !currentState });
      toast.success("Quote updated successfully");
      loadQuotes();
    } catch (error) {
      toast.error("Failed to update quote");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Quote" : "Create New Quote"}</CardTitle>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                value={formData.quote}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quote: e.target.value }))
                }
                required
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Set as Active</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit">
              {editingId ? "Update Quote" : "Create Quote"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold">Existing Quotes</h2>
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QuoteIcon className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">By {quote.author}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={quote.isActive}
                    onCheckedChange={() =>
                      handleToggleActive(quote.id!, quote.isActive)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(quote)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(quote.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-4 border-primary/20 pl-4 italic">
                {quote.quote}
              </blockquote>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
