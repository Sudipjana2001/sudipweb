import { useState, useRef } from "react";
import { useAllHeroSlides } from "@/hooks/useHeroSlides";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, Upload, X, ArrowUp, ArrowDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface HeroSlideForm {
  image_url: string;
  headline: string;
  subheadline: string;
  cta1_text: string;
  cta1_link: string;
  cta2_text: string;
  cta2_link: string;
  display_order: number;
  is_active: boolean;
}

export function HeroSlidesManager() {
  const { data: slides = [], isLoading } = useAllHeroSlides();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [newSlide, setNewSlide] = useState<HeroSlideForm>({
    image_url: "",
    headline: "",
    subheadline: "",
    cta1_text: "Shop Now",
    cta1_link: "/shop",
    cta2_text: "Explore",
    cta2_link: "/shop",
    display_order: slides.length + 1,
    is_active: true,
  });

  const [editForm, setEditForm] = useState<HeroSlideForm>({
    image_url: "",
    headline: "",
    subheadline: "",
    cta1_text: "",
    cta1_link: "",
    cta2_text: "",
    cta2_link: "",
    display_order: 0,
    is_active: true,
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    if (isEdit) {
      setEditForm({ ...editForm, image_url: publicUrl });
    } else {
      setNewSlide({ ...newSlide, image_url: publicUrl });
    }

    toast.success("Image uploaded successfully");
    setUploading(false);
  };

  const handleAddSlide = async () => {
    if (!newSlide.headline || !newSlide.image_url) {
      toast.error("Please fill in headline and upload an image");
      return;
    }

    const { error } = await supabase.from("hero_slides").insert({
      image_url: newSlide.image_url,
      headline: newSlide.headline,
      subheadline: newSlide.subheadline || null,
      cta1_text: newSlide.cta1_text || null,
      cta1_link: newSlide.cta1_link || null,
      cta2_text: newSlide.cta2_text || null,
      cta2_link: newSlide.cta2_link || null,
      display_order: newSlide.display_order,
      is_active: newSlide.is_active,
    });

    if (error) {
      toast.error("Failed to add slide");
      return;
    }

    toast.success("Slide added successfully");
    queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    queryClient.invalidateQueries({ queryKey: ["all-hero-slides"] });
    setIsAddingSlide(false);
    setNewSlide({
      image_url: "",
      headline: "",
      subheadline: "",
      cta1_text: "Shop Now",
      cta1_link: "/shop",
      cta2_text: "Explore",
      cta2_link: "/shop",
      display_order: slides.length + 1,
      is_active: true,
    });
  };

  const handleEdit = (slide: any) => {
    setEditingId(slide.id);
    setEditForm({
      image_url: slide.image_url,
      headline: slide.headline,
      subheadline: slide.subheadline || "",
      cta1_text: slide.cta1_text || "",
      cta1_link: slide.cta1_link || "",
      cta2_text: slide.cta2_text || "",
      cta2_link: slide.cta2_link || "",
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("hero_slides")
      .update({
        image_url: editForm.image_url,
        headline: editForm.headline,
        subheadline: editForm.subheadline || null,
        cta1_text: editForm.cta1_text || null,
        cta1_link: editForm.cta1_link || null,
        cta2_text: editForm.cta2_text || null,
        cta2_link: editForm.cta2_link || null,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update slide");
      return;
    }

    toast.success("Slide updated successfully");
    queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    queryClient.invalidateQueries({ queryKey: ["all-hero-slides"] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    const { error } = await supabase.from("hero_slides").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete slide");
      return;
    }

    toast.success("Slide deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    queryClient.invalidateQueries({ queryKey: ["all-hero-slides"] });
  };

  const handleMoveSlide = async (id: string, direction: "up" | "down") => {
    const currentIndex = slides.findIndex((s) => s.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[currentIndex];
    const targetSlide = slides[targetIndex];

    // Swap display_order
    await Promise.all([
      supabase
        .from("hero_slides")
        .update({ display_order: targetSlide.display_order })
        .eq("id", currentSlide.id),
      supabase
        .from("hero_slides")
        .update({ display_order: currentSlide.display_order })
        .eq("id", targetSlide.id),
    ]);

    toast.success("Slide order updated");
    queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    queryClient.invalidateQueries({ queryKey: ["all-hero-slides"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hero Slides</h2>
          <p className="text-muted-foreground">
            Manage the homepage hero section slides
          </p>
        </div>
        <Dialog open={isAddingSlide} onOpenChange={setIsAddingSlide}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Hero Slide</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Hero Image *</Label>
                <div className="mt-2 space-y-4">
                  {newSlide.image_url && (
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <img
                        src={newSlide.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => setNewSlide({ ...newSlide, image_url: "" })}
                        className="absolute right-2 top-2 rounded-full bg-background p-2 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Headline *</Label>
                <Input
                  id="headline"
                  value={newSlide.headline}
                  onChange={(e) =>
                    setNewSlide({ ...newSlide, headline: e.target.value })
                  }
                  placeholder="Summer Collection 2024"
                />
              </div>

              <div>
                <Label htmlFor="subheadline">Subheadline</Label>
                <Textarea
                  id="subheadline"
                  value={newSlide.subheadline}
                  onChange={(e) =>
                    setNewSlide({ ...newSlide, subheadline: e.target.value })
                  }
                  placeholder="Breathable fabrics, effortless style..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cta1_text">Primary CTA Text</Label>
                  <Input
                    id="cta1_text"
                    value={newSlide.cta1_text}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, cta1_text: e.target.value })
                    }
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="cta1_link">Primary CTA Link</Label>
                  <Input
                    id="cta1_link"
                    value={newSlide.cta1_link}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, cta1_link: e.target.value })
                    }
                    placeholder="/shop"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cta2_text">Secondary CTA Text</Label>
                  <Input
                    id="cta2_text"
                    value={newSlide.cta2_text}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, cta2_text: e.target.value })
                    }
                    placeholder="Explore"
                  />
                </div>
                <div>
                  <Label htmlFor="cta2_link">Secondary CTA Link</Label>
                  <Input
                    id="cta2_link"
                    value={newSlide.cta2_link}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, cta2_link: e.target.value })
                    }
                    placeholder="/shop"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newSlide.is_active}
                  onChange={(e) =>
                    setNewSlide({ ...newSlide, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button onClick={handleAddSlide} className="w-full">
                Add Slide
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Preview</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Headline</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide, index) => (
                <tr key={slide.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <img
                      src={slide.image_url}
                      alt={slide.headline}
                      className="h-16 w-24 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {editingId === slide.id ? (
                      <Input
                        value={editForm.headline}
                        onChange={(e) =>
                          setEditForm({ ...editForm, headline: e.target.value })
                        }
                        className="w-48"
                      />
                    ) : (
                      <div>
                        <p className="font-medium">{slide.headline}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {slide.subheadline}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === slide.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) =>
                          setEditForm({ ...editForm, is_active: e.target.checked })
                        }
                      />
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          slide.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {slide.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveSlide(slide.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveSlide(slide.id, "down")}
                        disabled={index === slides.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === slide.id ? (
                        <>
                          <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(slide)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(slide.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
