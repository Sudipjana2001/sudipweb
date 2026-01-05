import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useCollections } from "@/hooks/useProducts";

export function FeaturedCollections() {
  const navigate = useNavigate();
  const { data: collections = [], isLoading } = useCollections();
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.05 });

  // Default fallback images
  const fallbackImages: Record<string, string> = {
    'summer-vibes': "/collection-summer.jpg",
    'cozy-winter': "/collection-winter.jpg",
    'rainy-days': "/collection-rainy.jpg",
    summer: "/collection-summer.jpg",
    winter: "/collection-winter.jpg",
    rainy: "/collection-rainy.jpg",
  };

  if (isLoading) {
    return (
      <section className="bg-background py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (collections.length === 0) return null;

  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`mb-16 text-center transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Curated For You
          </p>
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Featured Collections
          </h2>
        </div>

        {/* Collections Grid */}
        <div ref={gridRef} className="grid gap-8 md:grid-cols-3">
          {collections.slice(0, 3).map((collection, index) => (
            <div
              key={collection.id}
              className={`group relative cursor-pointer overflow-hidden bg-muted transition-all duration-700 hover:shadow-elevated ${
                gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onClick={() => navigate(`/collection/${collection.slug}`)}
            >
              {/* Image Container */}
              <div className="aspect-[3/4] overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                  style={{ 
                    backgroundImage: `url(${collection.image_url || fallbackImages[collection.slug] || "/collection-summer.jpg"})` 
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
              </div>

              {/* Tag */}
              <div className="absolute left-6 top-6 overflow-hidden">
                <span className="inline-block bg-background/90 px-3 py-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-foreground transition-transform duration-500 group-hover:translate-y-0 translate-y-0">
                  Collection
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                <h3 className="mb-2 font-display text-2xl font-medium transition-transform duration-500 group-hover:-translate-y-1">
                  {collection.name}
                </h3>
                <p className="mb-6 font-body text-sm text-background/80 transition-all duration-500 group-hover:-translate-y-1">
                  {collection.description || "Explore our curated collection"}
                </p>
                <Button 
                  variant="hero-outline" 
                  className="border-background text-background transition-all duration-300 hover:bg-background hover:text-foreground group-hover:-translate-y-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/collection/${collection.slug}`);
                  }}
                >
                  View Collection
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
