import { useParams, Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/hooks/useProducts";
import {
  useProductReviews,
  useMarkReviewHelpful,
  getAverageRating,
  getRatingDistribution,
} from "@/hooks/useReviews";
import { Star, ThumbsUp, ChevronLeft, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

export default function ProductReviews() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading: productLoading } = useProduct(slug || "");
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product?.id || "");
  const markHelpful = useMarkReviewHelpful();

  const averageRating = getAverageRating(reviews);
  const distribution = getRatingDistribution(reviews);
  const totalReviews = reviews.length;

  if (productLoading || reviewsLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-32 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-4 font-display text-4xl">Product Not Found</h1>
          <Link to="/shop" className="font-body text-muted-foreground underline">
            Return to Shop
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead
        title={`Reviews for ${product.name}`}
        description={`Read customer reviews for ${product.name}. See ratings, photos, and verified purchase feedback from Pebric shoppers.`}
        keywords={`${product.name} reviews, Pebric reviews, pet outfit reviews, customer feedback`}
      />
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/product/${slug}`)}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Product
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
            Customer Reviews
          </h1>
          <p className="text-muted-foreground">
            Reviews for <Link to={`/product/${slug}`} className="underline hover:text-foreground">{product.name}</Link>
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          {/* Summary Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-display text-5xl font-bold">
                  {averageRating ? averageRating.toFixed(1) : "—"}
                </span>
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
                    {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Distribution */}
              <div className="space-y-2">
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
            </div>
          </div>

          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Star className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-medium">No reviews yet</p>
                <p className="text-sm text-muted-foreground">Be the first to review this product</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
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
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {review.photos.map((photo, idx) => (
                          <div key={idx} className="h-24 w-24 rounded-lg overflow-hidden bg-muted">
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
                        markHelpful.mutate({ id: review.id, product_id: product.id });
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
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
