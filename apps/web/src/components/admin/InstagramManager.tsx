import { useState } from "react";
import { useAllInstagramPosts } from "@/hooks/useInstagramPosts";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, ArrowUp, ArrowDown, Upload, Heart, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface InstagramPostForm {
  image_url: string;
  caption: string;
  post_url: string;
  likes_count: number;
  display_order: number;
  is_active: boolean;
}

export function InstagramManager() {
  const { data: posts = [], isLoading } = useAllInstagramPosts();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newPost, setNewPost] = useState<InstagramPostForm>({
    image_url: "",
    caption: "",
    post_url: "https://instagram.com",
    likes_count: 0,
    display_order: posts.length + 1,
    is_active: true,
  });

  const [editForm, setEditForm] = useState<InstagramPostForm>({
    image_url: "",
    caption: "",
    post_url: "",
    likes_count: 0,
    display_order: 0,
    is_active: true,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `instagram/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (isEdit) {
        setEditForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setNewPost(prev => ({ ...prev, image_url: publicUrl }));
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Error uploading image");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.image_url) {
      toast.error("Please upload an image");
      return;
    }

    const { error } = await supabase.from("instagram_posts").insert({
      image_url: newPost.image_url,
      caption: newPost.caption || null,
      post_url: newPost.post_url,
      likes_count: newPost.likes_count,
      display_order: newPost.display_order,
      is_active: newPost.is_active,
    });

    if (error) {
      toast.error("Failed to add post");
      return;
    }

    toast.success("Post added successfully");
    queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
    queryClient.invalidateQueries({ queryKey: ["all-instagram-posts"] });
    setIsAddingPost(false);
    setNewPost({
      image_url: "",
      caption: "",
      post_url: "https://instagram.com",
      likes_count: 0,
      display_order: posts.length + 1,
      is_active: true,
    });
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setEditForm({
      image_url: post.image_url,
      caption: post.caption || "",
      post_url: post.post_url,
      likes_count: post.likes_count,
      display_order: post.display_order,
      is_active: post.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("instagram_posts")
      .update({
        image_url: editForm.image_url,
        caption: editForm.caption || null,
        post_url: editForm.post_url,
        likes_count: editForm.likes_count,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update post");
      return;
    }

    toast.success("Post updated successfully");
    queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
    queryClient.invalidateQueries({ queryKey: ["all-instagram-posts"] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await supabase.from("instagram_posts").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete post");
      return;
    }

    toast.success("Post deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
    queryClient.invalidateQueries({ queryKey: ["all-instagram-posts"] });
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = posts.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= posts.length) return;

    const currentPost = posts[currentIndex];
    const targetPost = posts[targetIndex];

    await Promise.all([
      supabase
        .from("instagram_posts")
        .update({ display_order: targetPost.display_order })
        .eq("id", currentPost.id),
      supabase
        .from("instagram_posts")
        .update({ display_order: currentPost.display_order })
        .eq("id", targetPost.id),
    ]);

    toast.success("Order updated");
    queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
    queryClient.invalidateQueries({ queryKey: ["all-instagram-posts"] });
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
          <h2 className="text-2xl font-bold">Instagram Feed</h2>
          <p className="text-muted-foreground">
            Manage posts displayed in the Instagram feed section
          </p>
        </div>
        <Dialog open={isAddingPost} onOpenChange={setIsAddingPost}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Instagram Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Post Image *</Label>
                <div className="mt-2 flex items-center gap-4">
                  {newPost.image_url && (
                    <img 
                      src={newPost.image_url} 
                      alt="Preview" 
                      className="h-20 w-20 rounded-md object-cover border"
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
                        {uploading ? "Uploading..." : "Upload Image"}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  placeholder="Sunday vibes with the squad 🐾 #PebricStyle"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="likes">Likes Count</Label>
                  <Input
                    id="likes"
                    type="number"
                    value={newPost.likes_count}
                    onChange={(e) => setNewPost({ ...newPost, likes_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="url">Post URL</Label>
                  <Input
                    id="url"
                    value={newPost.post_url}
                    onChange={(e) => setNewPost({ ...newPost, post_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newPost.is_active}
                  onChange={(e) => setNewPost({ ...newPost, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button onClick={handleAddPost} className="w-full">
                Add Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((post, index) => (
          <div key={post.id} className="relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden group">
            <div className="relative aspect-square">
              {editingId === post.id ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <input
                      type="file"
                      id={`edit-image-${post.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                    />
                    <Button asChild variant="outline" size="sm">
                       <label htmlFor={`edit-image-${post.id}`} className="cursor-pointer">
                         Change Image
                       </label>
                    </Button>
                 </div>
              ) : (
                <img
                  src={post.image_url}
                  alt={post.caption || "Instagram post"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              
              {!post.is_active && (
                <div className="absolute inset-x-0 top-0 bg-red-500/80 py-1 text-center text-xs font-bold text-white">
                  INACTIVE
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {editingId === post.id ? (
                <>
                  <Textarea
                    value={editForm.caption}
                    onChange={(e) => setEditForm({...editForm, caption: e.target.value})}
                    placeholder="Caption"
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={editForm.likes_count}
                      onChange={(e) => setEditForm({...editForm, likes_count: parseInt(e.target.value)})}
                      className="h-8"
                    />
                  </div>
                  <Input
                      value={editForm.post_url}
                      onChange={(e) => setEditForm({...editForm, post_url: e.target.value})}
                      placeholder="Post URL"
                      className="h-8 text-xs"
                    />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                    />
                    <label className="text-sm">Active</label>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={handleSave} className="w-full">Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="w-full">Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                   <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {post.caption || "No caption"}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                      <span>{post.likes_count}</span>
                    </div>
                    {post.post_url && (
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleMove(post.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleMove(post.id, "down")}
                        disabled={index === posts.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(post)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
