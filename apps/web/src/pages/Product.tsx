import { useState, useEffect } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, Star, Truck, Shield, RotateCcw } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useProduct, useProductsByCollection, Product as ProductType } from "@/hooks/useProducts";
import { useProductReviews, getAverageRating } from "@/hooks/useReviews";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { BackInStockAlert } from "@/components/BackInStockAlert";
import { SizeRecommendation } from "@/components/SizeRecommendation";
import { ProductFabricInfo } from "@/components/ProductFabricInfo";
import { useTrackProductView } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
  const navigate = useNavigate();
  const { data: collectionProducts = [] } = useProductsByCollection(product?.collection?.slug || "");
  const { data: reviews = [] } = useProductReviews(product?.id || "");
  const averageRating = getAverageRating(reviews);
  const totalReviews = reviews.length;
  
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPetSize, setSelectedPetSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { user } = useAuth();
  const trackView = useTrackProductView();

  /* Safe access for loading state */
  const images = product?.images?.length ? product.images : [product?.image_url || "/product-1.jpg"];
  const sizes = product?.sizes || ["XS", "S", "M", "L", "XL"];
  const petSizes = product?.pet_sizes || ["XS", "S", "M", "L"];
  const features = product?.features || ["Premium quality materials", "Matching design for you and your pet", "Machine washable"];
  
  /* Removed numericId hack */
  const inWishlist = isInWishlist(product?.id || "");
  
  const relatedProducts = collectionProducts
    .filter((p) => p.id !== product?.id)
    .slice(0, 3);

  // Swipe gesture handlers
  const minSwipeDistance = 50;
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Show swipe hint on mount for mobile
  useEffect(() => {
    if (window.innerWidth < 768 && images.length > 1) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && images.length > 1) {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && images.length > 1) {
      setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  // Track product view
  useEffect(() => {
    if (product?.id && user) {
      trackView.mutate(product.id);
    }
  }, [product?.id, user]);

  if (isLoading) {
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



  const handleAddToCart = () => {
    if (!selectedSize && !selectedPetSize) {
      toast.error("Please select a size", {
        description: "Choose either your size or your pet's size.",
      });
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "/product-1.jpg",
        ownerSize: selectedSize || "N/A",
        petSize: selectedPetSize || "N/A",
        slug: product.slug,
      });
    }
    toast.success("Added to cart!", {
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize && !selectedPetSize) {
      toast.error("Please select a size", {
        description: "Choose either your size or your pet's size.",
      });
      return;
    }

    const buyNowItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || "/product-1.jpg",
      ownerSize: selectedSize || "N/A",
      petSize: selectedPetSize || "N/A",
      slug: product.slug,
      quantity: quantity,
    };

    navigate("/checkout", { state: { buyNowItem } });
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "/product-1.jpg",
        category: product.category?.name || "Fashion",
        slug: product.slug,
      });
      toast.success("Added to wishlist!");
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-body text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          {product.collection && (
            <>
              <Link to={`/collection/${product.collection.slug}`} className="capitalize hover:text-foreground">
                {product.collection.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[30%_1fr]">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div 
              className="relative aspect-square overflow-hidden bg-muted cursor-grab active:cursor-grabbing touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >


              <OptimizedImage
                src={images[currentImage]}
                alt={product.name}
                priority={true} // LCP Image
                sizes="(max-width: 768px) 100vw, 30vw"
                className="h-full w-full object-cover select-none pointer-events-none bg-muted"
                draggable={false}
              />
              <button
                onClick={handleWishlist}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 transition-colors hover:bg-background z-10"
              >
                <Heart
                  className={`h-5 w-5 ${
                    inWishlist ? "fill-destructive text-destructive" : "text-foreground"
                  }`}
                />
              </button>
              
              {/* Swipe Hint Overlay */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-500 ${
                  showSwipeHint ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                  <p className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Minus className="w-4 h-4" /> Swipe to view <Minus className="w-4 h-4" />
                  </p>
                </div>
              </div>

              {/* Image indicator dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        currentImage === idx 
                          ? "bg-foreground w-4" 
                          : "bg-foreground/40 hover:bg-foreground/60"
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`relative flex-shrink-0 aspect-square w-20 overflow-hidden border-2 transition-colors ${
                    currentImage === idx ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <OptimizedImage 
                    src={img} 
                    alt={`View ${idx + 1}`} 
                    sizes="80px"
                    className="h-full w-full object-cover" 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {product.category?.name || "Fashion"}
              </p>
              <h1 className="mb-4 font-display text-3xl font-medium tracking-tight md:text-4xl">
                {product.name}
              </h1>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= Math.floor(averageRating);
                    const halfFilled = star === Math.ceil(averageRating) && averageRating % 1 >= 0.3 && averageRating % 1 < 0.8;
                    
                    return (
                      <div key={star} className="relative">
                        <Star
                          className={`h-4 w-4 ${
                            filled
                              ? "fill-foreground text-foreground"
                              : "text-muted"
                          }`}
                        />
                        {halfFilled && (
                          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                            <Star className="h-4 w-4 fill-foreground text-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="font-body text-sm text-muted-foreground">
                  {averageRating > 0 ? averageRating.toFixed(1) : '0.0'} ({totalReviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-medium">₹{product.price}</span>
                {product.original_price && (
                  <span className="font-body text-lg text-muted-foreground line-through">
                    ₹{product.original_price}
                  </span>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-6">
              <div>
                <label className="mb-3 block font-body text-xs uppercase tracking-[0.2em] text-foreground">
                  Your Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 min-w-[48px] border px-4 font-body text-sm transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-body text-xs uppercase tracking-[0.2em] text-foreground">
                    Pet Size
                  </label>
                  <SizeRecommendation 
                    onSizeSelect={setSelectedPetSize} 
                    availableSizes={petSizes} 
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {petSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedPetSize(size)}
                      className={`h-12 min-w-[48px] border px-4 font-body text-sm transition-colors ${
                        selectedPetSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col gap-4">
              {/* Mobile: Quantity Selector */}
              <div className="flex items-center gap-3 sm:hidden">
                <div className="flex h-12 w-32 items-center border border-border">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-full flex-1 items-center justify-center transition-colors hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-body text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-full flex-1 items-center justify-center transition-colors hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons (and Desktop Layout) */}
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Desktop Quantity - Hidden on Mobile */}
                <div className="hidden h-14 items-center border border-border sm:flex">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-body">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-full w-12 items-center justify-center transition-colors hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button onClick={handleAddToCart} variant="hero" className="h-14 w-full flex-1 sm:w-auto">
                  Add to Cart
                </Button>
                <Button onClick={handleBuyNow} variant="hero-outline" className="h-14 w-full flex-1 sm:w-auto">
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t border-border pt-8">
              <h3 className="mb-4 font-display text-lg font-medium">Features</h3>
              <ul className="space-y-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-body text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-8">
              <h3 className="mb-4 font-display text-lg font-medium">Description</h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {product.description || "A beautiful matching set for you and your furry companion. Made with premium materials for comfort and style."}
              </p>
            </div>

            {/* Fabric & Care Info */}
            <ProductFabricInfo
              fabricType={(product as any).fabric_type}
              breathability={(product as any).breathability}
              stretchLevel={(product as any).stretch_level}
              isAllergySafe={(product as any).is_allergy_safe}
              careWash={(product as any).care_wash}
              careDry={(product as any).care_dry}
              durabilityRating={(product as any).durability_rating}
              seasonalTags={(product as any).seasonal_tags}
            />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-8">
              <div className="text-center">
                <Truck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">Quality Guarantee</p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} productName={product.name} productSlug={slug || ""} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <h2 className="mb-8 text-center font-display text-3xl font-medium">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed />
      </div>
    </PageLayout>
  );
}
