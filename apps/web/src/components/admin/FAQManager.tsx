import { useState } from "react";
import { useAllFAQs, FAQ } from "@/hooks/useFAQs";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FAQForm {
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const FAQ_CATEGORIES = [
  { value: "ordering", label: "Ordering" },
  { value: "shipping", label: "Shipping" },
  { value: "returns", label: "Returns & Exchanges" },
  { value: "sizing", label: "Sizing" },
  { value: "payments", label: "Payments" },
  { value: "general", label: "General" },
];

export function FAQManager() {
  const { data: faqs = [], isLoading } = useAllFAQs();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);

  const [newFAQ, setNewFAQ] = useState<FAQForm>({
    question: "",
    answer: "",
    category: "general",
    sort_order: faqs.length + 1,
    is_active: true,
  });

  const [editForm, setEditForm] = useState<FAQForm>({
    question: "",
    answer: "",
    category: "general",
    sort_order: 0,
    is_active: true,
  });

  const handleAddFAQ = async () => {
    if (!newFAQ.question || !newFAQ.answer) {
      toast.error("Please fill in both question and answer");
      return;
    }

    const { error } = await supabase.from("faqs").insert({
      question: newFAQ.question,
      answer: newFAQ.answer,
      category: newFAQ.category,
      sort_order: newFAQ.sort_order,
      is_active: newFAQ.is_active,
    });

    if (error) {
      toast.error("Failed to add FAQ");
      return;
    }

    toast.success("FAQ added successfully");
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
    setIsAddingFAQ(false);
    setNewFAQ({
      question: "",
      answer: "",
      category: "general",
      sort_order: faqs.length + 1,
      is_active: true,
    });
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("faqs")
      .update({
        question: editForm.question,
        answer: editForm.answer,
        category: editForm.category,
        sort_order: editForm.sort_order,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update FAQ");
      return;
    }

    toast.success("FAQ updated successfully");
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    const { error } = await supabase.from("faqs").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete FAQ");
      return;
    }

    toast.success("FAQ deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = faqs.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const currentFAQ = faqs[currentIndex];
    const targetFAQ = faqs[targetIndex];

    await Promise.all([
      supabase
        .from("faqs")
        .update({ sort_order: targetFAQ.sort_order })
        .eq("id", currentFAQ.id),
      supabase
        .from("faqs")
        .update({ sort_order: currentFAQ.sort_order })
        .eq("id", targetFAQ.id),
    ]);

    toast.success("FAQ order updated");
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
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
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Dialog open={isAddingFAQ} onOpenChange={setIsAddingFAQ}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                  placeholder="e.g., What is your return policy?"
                />
              </div>

              <div>
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  placeholder="e.g., We accept returns within 30 days..."
                  rows={5}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newFAQ.category}
                    onValueChange={(value) => setNewFAQ({ ...newFAQ, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newFAQ.is_active}
                    onChange={(e) => setNewFAQ({ ...newFAQ, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <Button onClick={handleAddFAQ} className="w-full">
                Add FAQ
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
                <th className="px-4 py-3 text-left text-sm font-medium">Question</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq, index) => (
                <tr key={faq.id} className="border-b border-border">
                  <td className="px-4 py-3 align-top">
                    {editingId === faq.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.question}
                          onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                          className="w-full"
                          placeholder="Question"
                        />
                        <Textarea
                          value={editForm.answer}
                          onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                          className="w-full"
                          placeholder="Answer"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{faq.question}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {editingId === faq.id ? (
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FAQ_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="capitalize">{faq.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {editingId === faq.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) =>
                            setEditForm({ ...editForm, is_active: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Active</span>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          faq.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {faq.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(faq.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(faq.id, "down")}
                        disabled={index === faqs.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      {editingId === faq.id ? (
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
                            onClick={() => handleEdit(faq)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(faq.id)}
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
