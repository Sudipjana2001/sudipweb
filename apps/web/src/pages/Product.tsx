import { useState, useEffect, useMemo } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RotateCcw,
  GitCompare,
  Share2,
} from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import {
  useProduct,
  useProductsByCollection,
  Product as ProductType,
} from "@/hooks/useProducts";
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
import { SEOHead } from "@/components/SEOHead";
import { useCompare } from "@/hooks/useCompare";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
  const navigate = useNavigate();
  const { data: collectionProducts = [] } = useProductsByCollection(
    product?.collection?.slug || "",
  );
  const { data: reviews = [] } = useProductReviews(product?.id || "");
  const averageRating = getAverageRating(reviews);
  const totalReviews = reviews.length;

  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPetSize, setSelectedPetSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } =
    useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { user } = useAuth();
  const trackView = useTrackProductView();

  /* Safe access for loading state */
  const images = product?.images?.length
    ? product.images
    : [product?.image_url || "/product-1.jpg"];
  const sizes = product?.sizes || ["XS", "S", "M", "L", "XL"];
  const petSizes = product?.pet_sizes || ["XS", "S", "M", "L"];
  const features = product?.features || [
    "Premium quality materials",
    "Matching design for you and your pet",
    "Machine washable",
  ];

  /* Removed numericId hack */
  const inWishlist = isInWishlist(product?.id || "");
  const inCompare = isInCompare(product?.id || "");

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

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.description ||
        `Premium matching outfit for you and your pet — ${product.name} by Pebric.`,
      image: images,
      brand: { "@type": "Brand", name: "Pebric" },
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `https://pebric.vercel.app/product/${slug}`,
      },
      ...(totalReviews > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount: totalReviews,
        },
      }),
    };
  }, [product, images, slug, averageRating, totalReviews]);

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
          <Link
            to="/shop"
            className="font-body text-muted-foreground underline"
          >
            Return to Shop
          </Link>
        </div>
      </PageLayout>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize && !selectedPetSize) {
      toast.error("Please select at least one size", {
        description: "Choose owner size, pet size, or both.",
      });
      return;
    }

    const basePrice = product.price;
    const halfPrice = Math.round(basePrice * 0.5);

    let totalAdded = 0;

    for (let i = 0; i < quantity; i++) {
      if (selectedSize && selectedPetSize) {
        addToCart({
          id: product.id,
          name: `${product.name} (Matching Set)`,
          price: basePrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: selectedSize,
          petSize: selectedPetSize,
          slug: product.slug,
        });
        totalAdded++;
      } else if (selectedSize) {
        addToCart({
          id: product.id,
          name: `${product.name} (Owner Only)`,
          price: halfPrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: selectedSize,
          petSize: "N/A",
          slug: product.slug,
        });
        totalAdded++;
      } else if (selectedPetSize) {
        addToCart({
          id: product.id,
          name: `${product.name} (Pet Only)`,
          price: halfPrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: "N/A",
          petSize: selectedPetSize,
          slug: product.slug,
        });
        totalAdded++;
      }
    }

    if (totalAdded > 0) {
      toast.success("Added to cart!", {
        description: `Added ${totalAdded} item(s) to your cart.`,
      });
    } else {
      toast.error("No items selected");
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize && !selectedPetSize) {
      toast.error("Please select at least one size", {
        description: "Choose owner size, pet size, or both.",
      });
      return;
    }

    const basePrice = product.price;
    const halfPrice = Math.round(basePrice * 0.5);

    const buyNowItems = [];

    for (let i = 0; i < quantity; i++) {
      if (selectedSize && selectedPetSize) {
        buyNowItems.push({
          id: product.id,
          name: `${product.name} (Matching Set)`,
          price: basePrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: selectedSize,
          petSize: selectedPetSize,
          slug: product.slug,
          quantity: 1,
        });
      } else if (selectedSize) {
        buyNowItems.push({
          id: product.id,
          name: `${product.name} (Owner Only)`,
          price: halfPrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: selectedSize,
          petSize: "N/A",
          slug: product.slug,
          quantity: 1,
        });
      } else if (selectedPetSize) {
        buyNowItems.push({
          id: product.id,
          name: `${product.name} (Pet Only)`,
          price: halfPrice,
          image: product.image_url || "/product-1.jpg",
          ownerSize: "N/A",
          petSize: selectedPetSize,
          slug: product.slug,
          quantity: 1,
        });
      }
    }

    navigate("/checkout", { state: { buyNowItems } });
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

  const handleShare = async () => {
    const shareUrl = new URL(
      `/product/${product.slug}`,
      window.location.origin,
    ).toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Pebric.`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied!");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Couldn't share product link");
    }
  };

  const handleCompare = () => {
    if (inCompare) {
      removeFromCompare(product.id);
      toast.info("Removed from compare");
      return;
    }

    const added = addToCompare(product.id);

    if (added) {
      toast.success("Added to compare", {
        action: {
          label: "View",
          onClick: () => navigate("/compare"),
        },
      });
      return;
    }

    toast.error("Maximum 3 products can be compared");
  };

  return (
    <PageLayout>
      <SEOHead
        title={product.name}
        description={
          product.description ||
          `Shop ${product.name} — premium matching outfit for you and your pet at Pebric.`
        }
        keywords={`${product.name}, ${product.category?.name || "pet fashion"}, matching outfit, Pebric, pet clothing`}
        image={product.image_url || "/product-1.jpg"}
        type="product"
        jsonLd={productJsonLd}
      />
      <div className="container mx-auto px-4 md:px-6 py-5 md:py-8">
        <div className="grid gap-6 md:gap-8 lg:gap-12 lg:grid-cols-[30%_1fr]">
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
                aria-label="Add to favourites"
              >
                <Heart
                  className={`h-5 w-5 ${
                    inWishlist
                      ? "fill-destructive text-destructive"
                      : "text-foreground"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 transition-colors hover:bg-background z-10"
                aria-label="Share product link"
              >
                <Share2 className="h-5 w-5 text-foreground" />
              </button>

              {/* Swipe Hint Overlay */}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-500 ${
                  showSwipeHint ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                  <p className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Minus className="w-4 h-4" /> Swipe to view{" "}
                    <Minus className="w-4 h-4" />
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
                    currentImage === idx
                      ? "border-foreground"
                      : "border-transparent"
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
          <div className="space-y-5 md:space-y-6">
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
                    const halfFilled =
                      star === Math.ceil(averageRating) &&
                      averageRating % 1 >= 0.3 &&
                      averageRating % 1 < 0.8;

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
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: "50%" }}
                          >
                            <Star className="h-4 w-4 fill-foreground text-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="font-body text-sm text-muted-foreground">
                  {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} (
                  {totalReviews} reviews)
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-medium">
                    ₹{product.price}
                  </span>
                  {product.original_price && (
                    <span className="font-body text-lg text-muted-foreground line-through">
                      ₹{product.original_price}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant={inCompare ? "default" : "outline"}
                  size="sm"
                  onClick={handleCompare}
                  className="h-10 shrink-0 gap-2 px-3 font-body text-[10px] uppercase tracking-[0.18em] md:px-4"
                >
                  <GitCompare className="h-4 w-4" />
                  {inCompare ? "In Compare" : "Add to Compare"}
                </Button>
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="mb-3 block font-body text-xs uppercase tracking-[0.2em] text-foreground">
                  Your Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[44px] px-3 text-xs md:h-12 md:min-w-[48px] md:px-4 md:text-sm border font-body transition-colors ${
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
                <div className="mb-3 flex items-center justify-between">
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
                      className={`h-10 min-w-[44px] px-3 text-xs md:h-12 md:min-w-[48px] md:px-4 md:text-sm border font-body transition-colors ${
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
            <div className="flex flex-col gap-3">
              <div className="w-full max-w-[220px] md:max-w-[260px]">
                <label className="mb-2 block font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
                  Quantity
                </label>
                <div className="flex h-10 items-center border border-border md:h-12">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-full w-10 items-center justify-center transition-colors hover:bg-muted md:w-12"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center font-body text-xs md:text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-full w-10 items-center justify-center transition-colors hover:bg-muted md:w-12"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleAddToCart}
                  variant="hero"
                  className="h-14 w-full flex-1 sm:w-auto"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="hero-outline"
                  className="h-14 w-full flex-1 sm:w-auto"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>

          {/* Features (Desktop - Row 2 Left) */}
          <div className="hidden lg:block lg:border-t lg:border-border lg:pt-8 lg:-mr-8 lg:pr-8">
            <h3 className="mb-4 font-display text-lg font-medium">Features</h3>
            <ul className="space-y-2 leading-relaxed">
              {features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 font-body text-muted-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Description & Additional Info (Row 2 Right) */}
          <div className="space-y-5 md:space-y-6 lg:border-t lg:border-border lg:pt-8 lg:-ml-8 lg:pl-8">
            {/* Features (Mobile) */}
            <div className="border-t border-border pt-6 md:pt-8 lg:hidden">
              <h3 className="mb-4 font-display text-lg font-medium">
                Features
              </h3>
              <ul className="space-y-2">
                {features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 font-body text-muted-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-6 md:pt-8 lg:border-none lg:pt-0">
              <h3 className="mb-4 font-display text-lg font-medium">
                Description
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {product.description ||
                  "A beautiful matching set for you and your furry companion. Made with premium materials for comfort and style."}
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
            <div className="grid grid-cols-3 gap-3 md:gap-4 border-t border-border pt-6 md:pt-8">
              <div className="text-center">
                <Truck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">
                  Free Shipping
                </p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">
                  Quality Guarantee
                </p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">
                  Easy Returns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews
          productId={product.id}
          productName={product.name}
          productSlug={slug || ""}
        />

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
