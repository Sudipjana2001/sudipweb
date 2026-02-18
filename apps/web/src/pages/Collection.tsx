import { useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { ProductCard } from "@/components/ProductCard";
import { useProductsByCollection, useCollections } from "@/hooks/useProducts";
import { SEOHead } from "@/components/SEOHead";

type SortOption = "featured" | "price-low" | "price-high" | "newest";

export default function Collection() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  
  // Determine slug from URL path if not provided as param
  // For routes like /summer, /winter, /rainy defined in App.tsx
  const pathSlug = location.pathname.split('/')[1];
  const collectionSlug = slug || (["summer", "winter", "rainy"].includes(pathSlug) ? pathSlug : "summer");
  
  console.log("Collection Debug:", { slug, pathSlug, collectionSlug });

  const { data: products = [], isLoading: productsLoading } = useProductsByCollection(collectionSlug);
  const { data: collections = [] } = useCollections();

  console.log("Collection Data:", { productsLength: products.length, collectionsLength: collections.length });
  
  const collection = collections.find(c => c.slug === collectionSlug);
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Fallback images
  const fallbackImages: Record<string, string> = {
    summer: "/collection-summer.jpg",
    winter: "/collection-winter.jpg",
    rainy: "/collection-rainy.jpg",
  };

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "newest":
        return sorted.sort((a, b) => (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const collectionImage = collection?.image_url || fallbackImages[collectionSlug] || "/collection-summer.jpg";
  const collectionName = collection?.name || `${collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)} Collection`;
  const collectionDescription = collection?.description || "Explore our curated collection of matching outfits for you and your pet.";

  return (
    <PageLayout>
      <SEOHead
        title={`${collectionName} — Matching Pet & Owner Outfits`}
        description={collectionDescription}
        keywords={`${collectionSlug} pet outfits, ${collectionSlug} matching clothes, Pebric ${collectionSlug}, pet fashion ${collectionSlug}`}
        image={collectionImage}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collectionName,
          description: collectionDescription,
          url: `https://pebric.vercel.app/collection/${collectionSlug}`,
        }}
      />
      {/* Hero Banner */}
      <section className="relative h-[50vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={collectionImage}
            alt={collectionName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/40" />
        </div>
        <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-background/80">
            Explore Our
          </p>
          <h1 className="mb-4 font-display text-5xl font-medium tracking-tight text-background md:text-7xl">
            {collectionName}
          </h1>
          <p className="max-w-xl font-body text-lg text-background/90">
            {collectionDescription}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12 flex items-center justify-between">
            <p className="font-body text-sm text-muted-foreground">
              {productsLoading ? "Loading..." : `${sortedProducts.length} Products`}
            </p>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-border bg-transparent px-4 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!productsLoading && sortedProducts.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-body text-lg text-muted-foreground">
                No products found in this collection.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
