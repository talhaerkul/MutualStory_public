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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/TextArea";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Banner } from "@/lib/types/Banner";

const emptyBanner: Omit<Banner, "id" | "createdAt"> = {
  title: "",
  description: "",
  imageUrl: "",
  buttonText: "",
  buttonLink: "",
  isActive: false,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyBanner);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await contentService.getAllBanners();
      setBanners(data);
    } catch (error) {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await contentService.updateBanner(editingId, formData);
        toast.success("Banner updated successfully");
      } else {
        await contentService.createBanner(formData);
        toast.success("Banner created successfully");
      }
      setFormData(emptyBanner);
      setEditingId(null);
      loadBanners();
    } catch (error) {
      toast.error(
        editingId ? "Failed to update banner" : "Failed to create banner"
      );
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id!);
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      isActive: banner.isActive,
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyBanner);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await contentService.deleteBanner(id);
      toast.success("Banner deleted successfully");
      loadBanners();
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await contentService.updateBanner(id, { isActive: !currentState });
      toast.success("Banner updated successfully");
      loadBanners();
    } catch (error) {
      toast.error("Failed to update banner");
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
          <CardTitle>
            {editingId ? "Edit Banner" : "Create New Banner"}
          </CardTitle>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    buttonText: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buttonLink">Button Link</Label>
              <Input
                id="buttonLink"
                value={formData.buttonLink}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    buttonLink: e.target.value,
                  }))
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
              {editingId ? "Update Banner" : "Create Banner"}
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
        <h2 className="text-2xl font-bold">Existing Banners</h2>
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{banner.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={() =>
                      handleToggleActive(banner.id!, banner.isActive)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(banner.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <img
                  src={banner.imageUrl || "/placeholder.svg"}
                  alt={banner.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-muted-foreground">{banner.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Button:</span>
                  <span>{banner.buttonText}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{banner.buttonLink}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
