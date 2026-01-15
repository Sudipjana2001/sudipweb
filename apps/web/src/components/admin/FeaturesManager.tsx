import { useState } from "react";
import { useAllFeatures } from "@/hooks/useFeatures";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Common Lucide icons for features
const AVAILABLE_ICONS = [
  "Sparkles", "Heart", "RefreshCw", "Truck", "Shield", "Star",
  "Award", "Check", "Gift", "Zap", "Target", "TrendingUp"
];

interface FeatureForm {
  icon_name: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export function FeaturesManager() {
  const { data: features = [], isLoading } = useAllFeatures();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  const [newFeature, setNewFeature] = useState<FeatureForm>({
    icon_name: "Sparkles",
    title: "",
    description: "",
    display_order: features.length + 1,
    is_active: true,
  });

  const [editForm, setEditForm] = useState<FeatureForm>({
    icon_name: "",
    title: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  const handleAddFeature = async () => {
    if (!newFeature.title || !newFeature.description) {
      toast.error("Please fill in title and description");
      return;
    }

    const { error } = await supabase.from("features").insert({
      icon_name: newFeature.icon_name,
      title: newFeature.title,
      description: newFeature.description,
      display_order: newFeature.display_order,
      is_active: newFeature.is_active,
    });

    if (error) {
      toast.error("Failed to add feature");
      return;
    }

    toast.success("Feature added successfully");
    queryClient.invalidateQueries({ queryKey: ["features"] });
    queryClient.invalidateQueries({ queryKey: ["all-features"] });
    setIsAddingFeature(false);
    setNewFeature({
      icon_name: "Sparkles",
      title: "",
      description: "",
      display_order: features.length + 1,
      is_active: true,
    });
  };

  const handleEdit = (feature: any) => {
    setEditingId(feature.id);
    setEditForm({
      icon_name: feature.icon_name,
      title: feature.title,
      description: feature.description,
      display_order: feature.display_order,
      is_active: feature.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("features")
      .update({
        icon_name: editForm.icon_name,
        title: editForm.title,
        description: editForm.description,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update feature");
      return;
    }

    toast.success("Feature updated successfully");
    queryClient.invalidateQueries({ queryKey: ["features"] });
    queryClient.invalidateQueries({ queryKey: ["all-features"] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return;

    const { error } = await supabase.from("features").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete feature");
      return;
    }

    toast.success("Feature deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["features"] });
    queryClient.invalidateQueries({ queryKey: ["all-features"] });
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = features.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;

    const currentFeature = features[currentIndex];
    const targetFeature = features[targetIndex];

    await Promise.all([
      supabase
        .from("features")
        .update({ display_order: targetFeature.display_order })
        .eq("id", currentFeature.id),
      supabase
        .from("features")
        .update({ display_order: currentFeature.display_order })
        .eq("id", targetFeature.id),
    ]);

    toast.success("Feature order updated");
    queryClient.invalidateQueries({ queryKey: ["features"] });
    queryClient.invalidateQueries({ queryKey: ["all-features"] });
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
          <h2 className="text-2xl font-bold">Features (Why Choose Us)</h2>
          <p className="text-muted-foreground">
            Manage features displayed in the "Why Choose Us" section
          </p>
        </div>
        <Dialog open={isAddingFeature} onOpenChange={setIsAddingFeature}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Feature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <select
                  id="icon"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newFeature.icon_name}
                  onChange={(e) => setNewFeature({ ...newFeature, icon_name: e.target.value })}
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  placeholder="Premium Fabrics"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  placeholder="Carefully selected materials for maximum comfort..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newFeature.is_active}
                  onChange={(e) => setNewFeature({ ...newFeature, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button onClick={handleAddFeature} className="w-full">
                Add Feature
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
                <th className="px-4 py-3 text-left text-sm font-medium">Icon</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={feature.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{feature.icon_name}</code>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === feature.id ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-48"
                      />
                    ) : (
                      <span className="font-medium">{feature.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === feature.id ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="min-w-[200px]"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {feature.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === feature.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      />
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          feature.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {feature.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(feature.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(feature.id, "down")}
                        disabled={index === features.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === feature.id ? (
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
                            onClick={() => handleEdit(feature)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(feature.id)}
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
