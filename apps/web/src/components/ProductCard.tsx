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
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <OptimizedImage
            src={image}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            transform={{ width: 560, height: 750, quality: 75, resize: "cover" }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {product.is_new_arrival && (
              <span className="bg-foreground px-3 py-1 font-body text-[10px] uppercase tracking-wider text-background">
                New
              </span>
            )}
            {product.original_price && (
              <span className="bg-destructive px-3 py-1 font-body text-[10px] uppercase tracking-wider text-destructive-foreground">
                Sale
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-1">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {category}
          </p>
          <h3 className="h-[45px] overflow-hidden font-display text-lg font-medium leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-body text-base font-medium text-foreground">
              ₹{product.price}
            </span>
            {product.original_price && (
              <span className="font-body text-sm text-muted-foreground line-through">
                ₹{product.original_price}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
