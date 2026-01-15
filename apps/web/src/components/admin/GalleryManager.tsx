import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Image as ImageIcon, Check, X, Star, Eye } from "lucide-react";

interface GalleryPost {
  id: string;
  image_url: string;
  caption: string | null;
  is_approved: boolean;
  is_featured: boolean;
  likes_count: number;
  created_at: string;
  user_id: string;
}

export function GalleryManager() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'featured'>('pending');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-gallery", filter],
    queryFn: async () => {
      let query = supabase.from("pet_gallery").select("*").order("created_at", { ascending: false });
      
      if (filter === 'pending') {
        query = query.eq("is_approved", false);
      } else if (filter === 'approved') {
        query = query.eq("is_approved", true);
      } else if (filter === 'featured') {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GalleryPost[];
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GalleryPost> }) => {
      const { error } = await supabase
        .from("pet_gallery")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast.success("Gallery post updated");
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast.success("Post deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gallery Moderation</h3>
        <div className="flex gap-2">
          {(['pending', 'approved', 'featured'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {filter} posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="group relative border rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt={post.caption || "Pet photo"}
                className="aspect-square object-cover w-full"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <Badge variant={post.is_approved ? "default" : "secondary"}>
                    {post.is_approved ? "Approved" : "Pending"}
                  </Badge>
                  {post.is_featured && (
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                
                <div>
                  {post.caption && (
                    <p className="text-white text-sm mb-2 line-clamp-2">{post.caption}</p>
                  )}
                  <p className="text-white/70 text-xs">❤️ {post.likes_count} likes</p>
                  
                  <div className="flex gap-2 mt-3">
                    {!post.is_approved && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updatePost.mutate({ id: post.id, updates: { is_approved: true } })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {post.is_approved && !post.is_featured && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updatePost.mutate({ id: post.id, updates: { is_featured: true } })}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    {post.is_featured && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updatePost.mutate({ id: post.id, updates: { is_featured: false } })}
                      >
                        Unfeature
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePost.mutate(post.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
