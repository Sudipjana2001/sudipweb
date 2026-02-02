import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useBestSellers, Product } from "@/hooks/useProducts";

export function BestSellers() {
  const { data: products = [], isLoading } = useBestSellers();
  const [startIndex, setStartIndex] = useState(0);
  
  // Responsive visible count
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else if (window.innerWidth < 1280) setVisibleCount(3);
      else setVisibleCount(4);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: sliderRef, isVisible: sliderVisible } = useScrollAnimation({ threshold: 0.05 });

  const nextProducts = () => {
    setStartIndex((prev) => 
      prev + visibleCount >= products.length ? 0 : prev + 1
    );
  };

  const prevProducts = () => {
    setStartIndex((prev) => 
      prev === 0 ? Math.max(0, products.length - visibleCount) : prev - 1
    );
  };

  if (isLoading) {
    return (
      <section className="bg-secondary py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-secondary py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`mb-12 flex items-end justify-between transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Most Loved
            </p>
            <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Best Sellers
            </h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={prevProducts}
              className="flex h-12 w-12 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105 active:scale-95"
              aria-label="Previous products"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextProducts}
              className="flex h-12 w-12 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105 active:scale-95"
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Products Slider */}
        <div 
          ref={sliderRef}
          className={`relative overflow-hidden transition-all duration-700 ${
            sliderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div 
            className="flex gap-6 transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${startIndex * (100 / visibleCount)}%)` }}
          >
            {products.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index} 
                width={`calc(${100 / visibleCount}% - ${24 * (visibleCount - 1) / visibleCount}px)`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mt-8 flex items-center justify-center gap-2 md:hidden">
          <button
            onClick={prevProducts}
            className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Previous products"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextProducts}
            className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Next products"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index, width }: { product: Product; index: number; width: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const sizes = product.sizes || ["S", "M", "L"];
  const petSizes = product.pet_sizes || ["S", "M", "L"];
  const [selectedSize, setSelectedSize] = useState(sizes[1] || sizes[0]);
  const [selectedPetSize, setSelectedPetSize] = useState(petSizes[1] || petSizes[0]);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();

  /* Removed numericId hack */
  const inWishlist = isInWishlist(product.id);
  const categoryName = product.category?.name || "Fashion";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || "/product-1.jpg",
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
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "/product-1.jpg",
        category: categoryName,
        slug: product.slug,
      });
      toast.success("Added to wishlist!");
    }
  };

  return (
    <Link to={`/product/${product.slug}`} style={{ width, minWidth: width }}>
      <div 
        className="group w-full flex-shrink-0 transition-transform duration-500"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
        {/* Image Container */}
        <div className="relative mb-4 overflow-hidden bg-muted aspect-[3/4] transition-shadow duration-500 group-hover:shadow-elevated">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ backgroundImage: `url(${product.image_url || "/product-1.jpg"})` }}
          />
          
          {/* Wishlist Button */}
          <button 
            onClick={handleWishlist}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 transition-all duration-300 hover:bg-background hover:scale-110 active:scale-95 ${
              isHovered || inWishlist ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart className={`h-4 w-4 transition-all duration-300 ${
              inWishlist ? "fill-destructive text-destructive scale-110" : "text-foreground"
            }`} />
          </button>

          {/* Quick Add Overlay */}
          <div 
            className={`absolute inset-x-0 bottom-0 bg-background/95 p-4 transition-all duration-300 ${
              isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            {/* Size Selectors */}
            <div className="mb-3 space-y-2">
              <div>
                <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                  Your Size
                </p>
                <div className="flex flex-wrap gap-1">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSize(size);
                      }}
                      className={`h-7 min-w-[28px] px-2 font-body text-xs transition-colors ${
                        selectedSize === size
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground hover:bg-foreground/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pet Size
                </p>
                <div className="flex flex-wrap gap-1">
                  {petSizes.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPetSize(size);
                      }}
                      className={`h-7 min-w-[28px] px-2 font-body text-xs transition-colors ${
                        selectedPetSize === size
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground hover:bg-foreground/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="premium" className="w-full" size="sm" onClick={handleAddToCart}>
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="mb-1 font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {categoryName}
          </p>
          <h3 className="mb-2 font-body text-sm font-medium text-foreground">
            {product.name}
          </h3>
          <p className="font-display text-lg text-foreground">
            ₹{product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}
