import { OptimizedImage } from "@/components/ui/optimized-image";
import { Link } from "react-router-dom";
import { Product as DBProduct } from "@/hooks/useProducts";

interface ProductCardProps {
  product: DBProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.image_url || "/product-1.jpg";
  const category = product.category?.name || "Fashion";
  const productLink = `/product/${product.slug}`;

  return (
    <Link to={productLink}>
      <div className="group relative">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-[20px]">
          <OptimizedImage
            src={image}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            transform={{ width: 560, height: 750, quality: 75, resize: "cover" }}
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
        <div className="mt-3 space-y-1 px-1">
          <h3 className="font-display text-base font-semibold leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-[#8b6540]">
              ₹{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="font-body text-sm text-muted-foreground line-through">
                ₹{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
