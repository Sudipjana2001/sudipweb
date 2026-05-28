import { OptimizedImage } from "@/components/ui/optimized-image";
import { Link } from "react-router-dom";
import { Product as DBProduct } from "@/hooks/useProducts";
import { useProductReviewSummary } from "@/hooks/useReviews";
import { useId } from "react";

interface ProductCardProps {
  product: DBProduct;
  priority?: boolean;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const uid = useId();
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          const clipId = `${uid}-star-${star}`;
          return (
            <svg
              key={star}
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Empty star background */}
              <path
                d="M10 1.25l2.472 5.01 5.528.803-4 3.9.944 5.505L10 13.757l-4.944 2.711L6 10.963l-4-3.9 5.528-.803L10 1.25z"
                fill="#e5e0d8"
              />
              {/* Filled star overlay with clip for partial fills */}
              {fill > 0 && (
                <defs>
                  <clipPath id={clipId}>
                    <rect x="0" y="0" width={fill * 20} height="20" />
                  </clipPath>
                </defs>
              )}
              {fill > 0 && (
                <path
                  d="M10 1.25l2.472 5.01 5.528.803-4 3.9.944 5.505L10 13.757l-4.944 2.711L6 10.963l-4-3.9 5.528-.803L10 1.25z"
                  fill="#d4a043"
                  clipPath={`url(#${clipId})`}
                />
              )}
            </svg>
          );
        })}
      </div>
      {count > 0 ? (
        <span className="font-body text-[11px] text-muted-foreground leading-none">
          ({count})
        </span>
      ) : (
        <span className="font-body text-[11px] text-muted-foreground/60 leading-none">
          No reviews
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.image_url || "/product-1.jpg";
  const productLink = `/product/${product.slug}`;
  const { data: reviewSummary } = useProductReviewSummary(product.id);

  return (
    <Link to={productLink}>
      <div className="group relative">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-2xl">
          <OptimizedImage
            src={image}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            transform={{ width: 480, height: 600, quality: 75, resize: "cover" }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.is_new_arrival && (
              <span className="bg-[#423a31] px-4 py-1.5 font-body text-xs text-white rounded-full">
                New
              </span>
            )}
            {product.original_price && (
              <span className="bg-[#ca6e53] px-4 py-1.5 font-body text-xs text-white rounded-full">
                Sale
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-3 space-y-1.5 px-1">
          <h3 className="font-display text-sm sm:text-base font-semibold leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          <StarRating
              rating={reviewSummary?.averageRating ?? 0}
              count={reviewSummary?.totalReviews ?? 0}
            />
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-[#8b6540]">
              ₹{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="font-body text-xs text-muted-foreground line-through">
                ₹{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
