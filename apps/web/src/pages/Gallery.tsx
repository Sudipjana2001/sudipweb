import { useState } from "react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGalleryPosts, useCreateGalleryPost, useLikeGalleryPost, useIsPostLiked, usePetOfTheWeek } from "@/hooks/useGallery";
import { usePets } from "@/hooks/usePets";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, Upload, Camera, Crown, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

function GalleryCard({ post }: { post: any }) {
  const { user } = useAuth();
  const { data: isLiked } = useIsPostLiked(post.id);
  const likeMutation = useLikeGalleryPost();

  const handleLike = () => {
    if (!user) return;
    likeMutation.mutate(post.id);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg bg-card">
      <div className="aspect-square overflow-hidden">
        <img
          src={post.image_url}
          alt={post.caption || "Pet photo"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform group-hover:translate-y-0">
        <div className="flex items-center justify-between text-white">
          <div>
            {post.pet?.name && (
              <p className="font-medium">{post.pet.name}</p>
            )}
            {post.caption && (
              <p className="text-sm text-white/80 line-clamp-2">{post.caption}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm"
              disabled={!user}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{post.likes_count}</span>
            </button>
          </div>
        </div>
        {post.product && (
          <Link
            to={`/product/${post.product.slug}`}
            className="mt-2 inline-block text-xs text-white/70 hover:text-white"
          >
            Wearing: {post.product.name}
          </Link>
        )}
      </div>
      {post.is_featured && (
        <div className="absolute top-2 right-2 rounded-full bg-yellow-500 p-1.5">
          <Crown className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
}

function UploadDialog() {
  const { user } = useAuth();
  const { data: pets = [] } = usePets();
  const { data: products = [] } = useProducts();
  const createPost = useCreateGalleryPost();
  
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [petId, setPetId] = useState("");
  const [productId, setProductId] = useState("");
  const [caption, setCaption] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    await createPost.mutateAsync({
      imageFile: file,
      petId: petId || undefined,
      productId: productId || undefined,
      caption: caption || undefined,
    });
    
    setOpen(false);
    setFile(null);
    setPreview(null);
    setPetId("");
    setProductId("");
    setCaption("");
  };

  if (!user) {
    return (
      <Link to="/login">
        <Button variant="hero">
          <Upload className="mr-2 h-4 w-4" />
          Share Your Pet
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Upload className="mr-2 h-4 w-4" />
          Share Your Pet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share a Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {preview ? (
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">Click to upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select your pet (optional)" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Tag a product (optional)" />
            </SelectTrigger>
            <SelectContent>
              {products.slice(0, 20).map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={3}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={!file || createPost.isPending}
            className="w-full"
          >
            {createPost.isPending ? "Uploading..." : "Submit"}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            Photos are reviewed before appearing in the gallery
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Gallery() {
  const { data: posts = [], isLoading } = useGalleryPosts();
  const { data: petOfTheWeek } = usePetOfTheWeek();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="font-display text-4xl font-medium md:text-5xl">Pet Gallery</h1>
          <p className="mt-4 text-muted-foreground">
            See our adorable customers in their PawStyle outfits
          </p>
          <div className="mt-6">
            <UploadDialog />
          </div>
        </div>
      </section>

      {/* Pet of the Week */}
      {petOfTheWeek?.gallery_post && (
        <section className="container mx-auto px-6 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 p-8 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-yellow-600" />
              <h2 className="font-display text-2xl font-medium">Pet of the Week</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={petOfTheWeek.gallery_post.image_url}
                  alt="Pet of the week"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-display text-3xl font-medium">
                  {petOfTheWeek.gallery_post.pet?.name || "Featured Pet"}
                </h3>
                {petOfTheWeek.gallery_post.pet?.breed && (
                  <p className="mt-2 text-muted-foreground">
                    {petOfTheWeek.gallery_post.pet.breed}
                  </p>
                )}
                {petOfTheWeek.gallery_post.caption && (
                  <p className="mt-4 text-lg">{petOfTheWeek.gallery_post.caption}</p>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    {petOfTheWeek.gallery_post.likes_count} likes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Grid */}
      <section className="container mx-auto px-6 py-6 md:py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl">No photos yet</h3>
            <p className="mt-2 text-muted-foreground">Be the first to share your pet!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <GalleryCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
