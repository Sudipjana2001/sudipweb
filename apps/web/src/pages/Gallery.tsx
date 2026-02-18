import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGalleryPosts, useCreateGalleryPost, useLikeGalleryPost, useIsPostLiked, usePostLikesCount, usePetOfTheWeek } from "@/hooks/useGallery";
import { usePets } from "@/hooks/usePets";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, Upload, Camera, Crown, Image as ImageIcon, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

/* ─── Lightbox for full-size photo view ─── */
function PhotoLightbox({
  post,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  post: any;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { user } = useAuth();
  const { data: isLiked } = useIsPostLiked(post.id);
  const { data: likesCount = 0 } = usePostLikesCount(post.id);
  const likeMutation = useLikeGalleryPost();

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  useEffect(() => { setOptimisticLiked(null); }, [isLiked]);
  useEffect(() => { setOptimisticCount(null); }, [likesCount]);

  const displayLiked = optimisticLiked !== null ? optimisticLiked : !!isLiked;
  const displayCount = optimisticCount !== null ? optimisticCount : likesCount;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const handleLike = () => {
    if (!user) { toast.error("Please log in to like photos"); return; }
    const newLiked = !displayLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount(newLiked ? displayCount + 1 : Math.max(0, displayCount - 1));
    likeMutation.mutate(post.id, {
      onError: () => { setOptimisticLiked(null); setOptimisticCount(null); toast.error("Failed to like"); },
    });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pebric-${post.pet?.name || "pet"}-${post.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Photo downloaded!");
    } catch {
      toast.error("Failed to download photo");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev / Next arrows */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:left-6"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:right-6"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Content */}
      <div
        className="relative flex max-h-[90vh] max-w-5xl flex-col items-center gap-4 overflow-y-auto px-4 md:flex-row md:gap-6 md:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex max-h-[50vh] flex-1 items-center justify-center md:max-h-[85vh]">
          <img
            src={post.image_url}
            alt={post.caption || "Pet photo"}
            className="max-h-[50vh] max-w-full rounded-lg object-contain shadow-2xl md:max-h-[85vh]"
          />
        </div>

        {/* Info panel */}
        <div className="w-full max-h-[30vh] flex-shrink-0 space-y-3 overflow-y-auto rounded-lg bg-white/5 p-4 text-white backdrop-blur-sm md:max-h-none md:w-72 md:overflow-visible">
          {post.pet?.name && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Pet</p>
              <p className="text-lg font-medium">{post.pet.name}</p>
              {post.pet.breed && (
                <p className="text-sm text-white/60">{post.pet.breed}</p>
              )}
            </div>
          )}

          {post.caption && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Caption</p>
              <p className="text-sm leading-relaxed text-white/80">{post.caption}</p>
            </div>
          )}

          {post.product && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Wearing</p>
              <Link
                to={`/product/${post.product.slug}`}
                className="text-sm text-white/80 underline underline-offset-2 hover:text-white"
                onClick={onClose}
              >
                {post.product.name}
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
            >
              <Heart className={`h-4 w-4 ${displayLiked ? "fill-red-500 text-red-500" : ""}`} />
              {displayCount}
            </button>
            {user && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                Save
              </button>
            )}
          </div>

          {post.is_featured && (
            <div className="flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1.5 text-sm text-yellow-300">
              <Crown className="h-4 w-4" />
              Featured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Gallery Card ─── */
function GalleryCard({ post, onOpen }: { post: any; onOpen: () => void }) {
  const { user } = useAuth();
  const { data: isLiked } = useIsPostLiked(post.id);
  const { data: likesCount = 0 } = usePostLikesCount(post.id);
  const likeMutation = useLikeGalleryPost();

  // Optimistic state for instant UI feedback
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  // Sync optimistic state with server data when it arrives
  useEffect(() => { setOptimisticLiked(null); }, [isLiked]);
  useEffect(() => { setOptimisticCount(null); }, [likesCount]);

  const displayLiked = optimisticLiked !== null ? optimisticLiked : !!isLiked;
  const displayCount = optimisticCount !== null ? optimisticCount : likesCount;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to like photos");
      return;
    }

    // Instant optimistic update
    const newLiked = !displayLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount(newLiked ? displayCount + 1 : Math.max(0, displayCount - 1));

    likeMutation.mutate(post.id, {
      onError: (error) => {
        // Revert on failure
        setOptimisticLiked(null);
        setOptimisticCount(null);
        console.error("Like failed:", error);
        toast.error("Failed to like", { description: error.message });
      },
    });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pebric-${post.pet?.name || "pet"}-${post.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Photo downloaded!");
    } catch {
      toast.error("Failed to download photo");
    }
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-card break-inside-avoid mb-4"
      onClick={onOpen}
    >
      <div className="overflow-hidden">
        <img
          src={post.image_url}
          alt={post.caption || "Pet photo"}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Action buttons - always visible */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-105"
          disabled={likeMutation.isPending}
        >
          <Heart className={`h-4 w-4 transition-colors ${displayLiked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{displayCount}</span>
        </button>
        {user && (
          <button
            onClick={handleDownload}
            className="flex items-center rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-105"
            title="Download photo"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Gradient - pointer-events-none so it doesn't block clicks */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Hover info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
        <div className="text-white">
          {post.pet?.name && (
            <p className="font-medium">{post.pet.name}</p>
          )}
          {post.caption && (
            <p className="text-sm text-white/80 line-clamp-2">{post.caption}</p>
          )}
        </div>
        {post.product && (
          <Link
            to={`/product/${post.product.slug}`}
            className="mt-2 inline-block text-xs text-white/70 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Wearing: {post.product.name}
          </Link>
        )}
      </div>

      {/* Featured badge */}
      {post.is_featured && (
        <div className="absolute top-2 right-2 z-20 rounded-full bg-yellow-500 p-1.5 shadow-lg">
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

  // Lightbox state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOpen = useCallback((index: number) => setSelectedIndex(index), []);
  const handleClose = useCallback(() => setSelectedIndex(null), []);
  const handlePrev = useCallback(() => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const handleNext = useCallback(() => setSelectedIndex((i) => (i !== null && i < posts.length - 1 ? i + 1 : i)), [posts.length]);

  return (
    <PageLayout>
      <SEOHead
        title="Pet Gallery"
        description="Browse adorable photos of pets wearing Pebric outfits. Share your own pet photos and vote for Pet of the Week!"
        keywords="pet gallery, pet photos, Pebric pets, pet fashion photos, pet of the week"
      />
      {/* Lightbox */}
      {selectedIndex !== null && posts[selectedIndex] && (
        <PhotoLightbox
          post={posts[selectedIndex]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < posts.length - 1}
        />
      )}

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
          <div className="columns-2 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {posts.map((post, index) => (
              <GalleryCard key={post.id} post={post} onOpen={() => handleOpen(index)} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
