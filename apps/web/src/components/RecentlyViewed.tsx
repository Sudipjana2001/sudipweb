import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Clock } from "lucide-react";

export function RecentlyViewed() {
  const { data: items = [], isLoading } = useRecentlyViewed();

  if (isLoading || items.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-xl font-medium">Recently Viewed</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.map((item) => (
            item.product && (
              <Link
                key={item.id}
                to={`/product/${item.product.slug}`}
                className="flex-shrink-0 w-40 group"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={item.product.image_url || "/product-1.jpg"}
                    alt={item.product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-sm font-medium line-clamp-1">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">₹{item.product.price}</p>
              </Link>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
