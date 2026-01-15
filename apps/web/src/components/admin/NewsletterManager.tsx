import { useState, useEffect } from "react";
import { useNewsletterConfig } from "@/hooks/useNewsletterConfig";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface NewsletterForm {
  badge_text: string;
  headline: string;
  description: string;
  is_active: boolean;
}

export function NewsletterManager() {
  const { data: config, isLoading } = useNewsletterConfig();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewsletterForm>({
    badge_text: "",
    headline: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        badge_text: config.badge_text,
        headline: config.headline,
        description: config.description,
        is_active: config.is_active,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return; // Should create if not exists, but migration creates default

    const { error } = await supabase
      .from("newsletter_config")
      .update({
        badge_text: formData.badge_text,
        headline: formData.headline,
        description: formData.description,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);

    if (error) {
      toast.error("Failed to update newsletter configuration");
      return;
    }

    toast.success("Newsletter configuration updated");
    queryClient.invalidateQueries({ queryKey: ["newsletter-config"] });
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
          <h2 className="text-2xl font-bold">Newsletter Configuration</h2>
          <p className="text-muted-foreground">
            Manage the newsletter section content
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-4 max-w-2xl">
          <div>
            <Label htmlFor="badge">Badge Text</Label>
            <Input
              id="badge"
              value={formData.badge_text}
              onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="headline">Headline *</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <Label htmlFor="is_active">Show Newsletter Section</Label>
          </div>

          <Button onClick={handleSave} className="mt-4">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
