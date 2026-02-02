import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Product as DBProduct } from "@/hooks/useProducts";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";

interface ProductCardProps {
  product: DBProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const sizes = product.sizes || ["XS", "S", "M", "L", "XL"];
  const petSizes = product.pet_sizes || ["XS", "S", "M", "L"];
  const image = product.image_url || "/product-1.jpg";
  const category = product.category?.name || "Fashion";
  
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(sizes[1] || sizes[0]);
  const [selectedPetSize, setSelectedPetSize] = useState(petSizes[1] || petSizes[0]);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const navigate = useNavigate();

  /* Removed numericId hack */
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);
  const productLink = `/product/${product.slug}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image,
      ownerSize: selectedSize,
      petSize: selectedPetSize,
      slug: product.slug,
    });
    toast.success("Added to cart!", {
      description: `${product.name} - Size ${selectedSize} / Pet ${selectedPetSize}`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: image,
        category: category,
        slug: product.slug,
      });
      toast.success("Added to wishlist!");
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(product.id);
      toast.info("Removed from compare");
    } else {
      const added = addToCompare(product.id);
      if (added) {
        toast.success("Added to compare", {
          action: {
            label: "View",
            onClick: () => navigate("/compare"),
          },
        });
      } else {
        toast.error("Maximum 4 products can be compared");
      }
    }
  };

  return (
    <Link to={productLink}>
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >


        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <OptimizedImage
            src={image}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 transition-all duration-300 hover:bg-background ${
              isHovered || inWishlist ? "opacity-100" : "opacity-0"
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                inWishlist ? "fill-destructive text-destructive" : "text-foreground"
              }`}
            />
          </button>

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            className={`absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 transition-all duration-300 hover:bg-background ${
              isHovered || inCompare ? "opacity-100" : "opacity-0"
            }`}
          >
            <GitCompare
              className={`h-5 w-5 transition-colors ${
                inCompare ? "text-primary" : "text-foreground"
              }`}
            />
          </button>


        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-1">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {category}
          </p>
          <h3 className="font-display text-lg font-medium text-foreground">
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
