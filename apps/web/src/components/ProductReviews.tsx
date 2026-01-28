import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  useProductReviews,
  useAddReview,
  useMarkReviewHelpful,
  getAverageRating,
  getRatingDistribution,
} from "@/hooks/useReviews";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, ThumbsUp, Camera, X, Check } from "lucide-react";
import { format } from "date-fns";

interface ProductReviewsProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export function ProductReviews({ productId, productName, productSlug }: ProductReviewsProps) {
  const { user } = useAuth();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const addReview = useAddReview();
  const markHelpful = useMarkReviewHelpful();

  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const averageRating = getAverageRating(reviews);
  const distribution = getRatingDistribution(reviews);
  const totalReviews = reviews.length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage.from("review-photos").upload(fileName, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("review-photos").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }

    setPhotos([...photos, ...uploadedUrls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    await addReview.mutateAsync({
      product_id: productId,
      rating,
      title: title || undefined,
      content: content || undefined,
      photos,
    });

    setIsWriting(false);
    setRating(0);
    setTitle("");
    setContent("");
    setPhotos([]);
  };

  const hasUserReviewed = reviews.some((r) => r.user_id === user?.id);

  console.log('Rendering ProductReviews component for', productId, 'with', reviews.length, 'total reviews. Slicing to 2.');

  return (
    <div className="mt-16 border-t border-border pt-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
        {/* Summary */}
        <div className="lg:w-72 flex-shrink-0">
          <h2 className="font-display text-2xl font-medium">Customer Reviews</h2>
          
          <div className="mt-6 flex items-center gap-3">
            <span className="font-display text-5xl font-bold">{averageRating ? averageRating.toFixed(1) : "—"}</span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= Math.floor(averageRating);
                  const halfFilled = star === Math.ceil(averageRating) && averageRating % 1 >= 0.3 && averageRating % 1 < 0.8;
                  
                  return (
                    <div key={star} className="relative">
                      <Star
                        className={`h-5 w-5 ${
                          filled
                            ? "fill-foreground text-foreground"
                            : "text-muted"
                        }`}
                      />
                      {halfFilled && (
                        <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                          <Star className="h-5 w-5 fill-foreground text-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Distribution */}
          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 fill-foreground text-foreground" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Write Review Button */}
          {user && !hasUserReviewed && (
            <Dialog open={isWriting} onOpenChange={setIsWriting}>
              <DialogTrigger asChild>
                <Button className="mt-6 w-full">Write a Review</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Review {productName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Rating */}
                  <div>
                    <p className="text-sm font-medium mb-2">Rating *</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-foreground text-foreground"
                                : "text-muted"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-sm font-medium mb-2">Title</p>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Summarize your experience"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-sm font-medium mb-2">Your Review</p>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tell us what you liked or didn't like..."
                      rows={4}
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <p className="text-sm font-medium mb-2">Photos (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((url, idx) => (
                        <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 rounded-full bg-background p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || photos.length >= 5}
                        className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-foreground transition-colors disabled:opacity-50"
                      >
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={addReview.isPending}
                    className="w-full"
                  >
                    Submit Review
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {!user && (
            <p className="mt-6 text-sm text-muted-foreground">
              <a href="/login" className="underline">Sign in</a> to write a review
            </p>
          )}
        </div>

        {/* Reviews List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Star className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to review this product</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {review.profiles?.avatar_url ? (
                            <img
                              src={review.profiles.avatar_url}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-muted-foreground">
                              {(review.profiles?.full_name || "A")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating ? "fill-foreground text-foreground" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <span>•</span>
                            <span>{format(new Date(review.created_at), "MMM d, yyyy")}</span>
                            {review.is_verified_purchase && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-green-600">
                                  <Check className="h-3 w-3" />
                                  Verified Purchase
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="mt-2 font-medium">{review.title}</h4>
                    )}

                    {review.content && (
                      <p className="mt-1 text-muted-foreground">{review.content}</p>
                    )}

                    {review.photos && review.photos.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {review.photos.map((photo, idx) => (
                          <div key={idx} className="h-20 w-20 rounded-lg overflow-hidden bg-muted">
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error("Please sign in to vote");
                          return;
                        }
                        markHelpful.mutate({ id: review.id, product_id: productId });
                      }}
                      disabled={!user || review.user_id === user?.id || review.user_has_voted}
                      className={`mt-2 flex items-center gap-2 text-sm transition-colors ${
                        review.user_has_voted
                          ? "text-primary cursor-default"
                          : review.user_id === user?.id
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground"
                      } disabled:cursor-not-allowed`}
                      title={
                        !user
                          ? "Sign in to vote"
                          : review.user_id === user?.id
                          ? "You cannot vote on your own review"
                          : review.user_has_voted
                          ? "You already voted this as helpful"
                          : "Mark as helpful"
                      }
                    >
                      <ThumbsUp
                        className={`h-4 w-4 ${review.user_has_voted ? "fill-primary" : ""}`}
                      />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                ))}
              </div>
              
              {/* See All Reviews Button */}
              {reviews.length > 2 && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/product/${productSlug}/reviews`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-foreground transition-colors font-medium text-sm"
                  >
                    VIEW ALL {reviews.length} Reviews
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
