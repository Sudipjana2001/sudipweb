import { useState } from "react";
import { useAllTestimonials } from "@/hooks/useTestimonials";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, ArrowUp, ArrowDown, Upload, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface TestimonialForm {
  customer_name: string;
  location: string;
  rating: number;
  review_text: string;
  pet_name: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

export function TestimonialsManager() {
  const { data: testimonials = [], isLoading } = useAllTestimonials();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newTestimonial, setNewTestimonial] = useState<TestimonialForm>({
    customer_name: "",
    location: "",
    rating: 5,
    review_text: "",
    pet_name: "",
    image_url: "",
    display_order: testimonials.length + 1,
    is_active: true,
  });

  const [editForm, setEditForm] = useState<TestimonialForm>({
    customer_name: "",
    location: "",
    rating: 5,
    review_text: "",
    pet_name: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images') // Reusing existing bucket for now
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (isEdit) {
        setEditForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setNewTestimonial(prev => ({ ...prev, image_url: publicUrl }));
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Error uploading image");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.customer_name || !newTestimonial.review_text) {
      toast.error("Please fill in required fields");
      return;
    }

    const { error } = await supabase.from("testimonials_cms").insert({
      customer_name: newTestimonial.customer_name,
      location: newTestimonial.location || null,
      rating: newTestimonial.rating,
      review_text: newTestimonial.review_text,
      pet_name: newTestimonial.pet_name || null,
      image_url: newTestimonial.image_url || null,
      display_order: newTestimonial.display_order,
      is_active: newTestimonial.is_active,
    });

    if (error) {
      toast.error("Failed to add testimonial");
      return;
    }

    toast.success("Testimonial added successfully");
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["all-testimonials"] });
    setIsAddingTestimonial(false);
    setNewTestimonial({
      customer_name: "",
      location: "",
      rating: 5,
      review_text: "",
      pet_name: "",
      image_url: "",
      display_order: testimonials.length + 1,
      is_active: true,
    });
  };

  const handleEdit = (testimonial: any) => {
    setEditingId(testimonial.id);
    setEditForm({
      customer_name: testimonial.customer_name,
      location: testimonial.location || "",
      rating: testimonial.rating,
      review_text: testimonial.review_text,
      pet_name: testimonial.pet_name || "",
      image_url: testimonial.image_url || "",
      display_order: testimonial.display_order,
      is_active: testimonial.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("testimonials_cms")
      .update({
        customer_name: editForm.customer_name,
        location: editForm.location || null,
        rating: editForm.rating,
        review_text: editForm.review_text,
        pet_name: editForm.pet_name || null,
        image_url: editForm.image_url || null,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update testimonial");
      return;
    }

    toast.success("Testimonial updated successfully");
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["all-testimonials"] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    const { error } = await supabase.from("testimonials_cms").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete testimonial");
      return;
    }

    toast.success("Testimonial deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["all-testimonials"] });
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = testimonials.findIndex((t) => t.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const currentTestimonial = testimonials[currentIndex];
    const targetTestimonial = testimonials[targetIndex];

    await Promise.all([
      supabase
        .from("testimonials_cms")
        .update({ display_order: targetTestimonial.display_order })
        .eq("id", currentTestimonial.id),
      supabase
        .from("testimonials_cms")
        .update({ display_order: currentTestimonial.display_order })
        .eq("id", targetTestimonial.id),
    ]);

    toast.success("Testimonial order updated");
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["all-testimonials"] });
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
          <h2 className="text-2xl font-bold">Testimonials</h2>
          <p className="text-muted-foreground">
            Manage customer reviews and success stories
          </p>
        </div>
        <Dialog open={isAddingTestimonial} onOpenChange={setIsAddingTestimonial}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Testimonial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={newTestimonial.customer_name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, customer_name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={newTestimonial.rating}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newTestimonial.location}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })}
                    placeholder="New York, NY"
                  />
                </div>
                <div>
                  <Label htmlFor="pet_name">Pet Name</Label>
                  <Input
                    id="pet_name"
                    value={newTestimonial.pet_name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, pet_name: e.target.value })}
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="review_text">Review *</Label>
                <Textarea
                  id="review_text"
                  value={newTestimonial.review_text}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, review_text: e.target.value })}
                  placeholder="Great product..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Customer Photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {newTestimonial.image_url && (
                    <img 
                      src={newTestimonial.image_url} 
                      alt="Preview" 
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e)}
                      disabled={uploading}
                    />
                    <Button asChild variant="outline" disabled={uploading}>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newTestimonial.is_active}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button onClick={handleAddTestimonial} className="w-full">
                Add Testimonial
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
                <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Review</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((testimonial, index) => (
                <tr key={testimonial.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       {testimonial.image_url ? (
                        <img 
                          src={testimonial.image_url} 
                          alt={testimonial.customer_name} 
                          className="h-8 w-8 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {testimonial.customer_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{testimonial.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                     {editingId === testimonial.id ? (
                      <Textarea
                        value={editForm.review_text}
                        onChange={(e) => setEditForm({ ...editForm, review_text: e.target.value })}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {testimonial.review_text}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-yellow-500">
                      {editingId === testimonial.id ? (
                        <Input 
                          type="number" 
                          min="1" 
                          max="5" 
                          className="w-16"
                          value={editForm.rating}
                          onChange={(e) => setEditForm({...editForm, rating: parseInt(e.target.value)})}
                        />
                      ) : (
                        <>
                          <span className="font-medium mr-1">{testimonial.rating}</span>
                          <Star className="h-3 w-3 fill-current" />
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === testimonial.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      />
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          testimonial.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {testimonial.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(testimonial.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(testimonial.id, "down")}
                        disabled={index === testimonials.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === testimonial.id ? (
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
                            onClick={() => handleEdit(testimonial)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(testimonial.id)}
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
