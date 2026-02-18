import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useCart();

  if (wishlistItems.length === 0) {
    return (
      <PageLayout showNewsletter={false}>
        <SEOHead title="My Wishlist" description="Your saved favorite items on Pebric." noindex={true} />
        <div className="container mx-auto px-6 py-32 text-center">
          <Heart className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-4 font-display text-4xl font-medium">Your Wishlist is Empty</h1>
          <p className="mb-8 font-body text-muted-foreground">
            Save your favorite items here for later.
          </p>
          <Link to="/shop">
            <Button variant="hero">Explore Products</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNewsletter={false}>
      <SEOHead title="My Wishlist" description="Your saved favorite items on Pebric." noindex={true} />
      <div className="container mx-auto px-6 py-6 md:py-8">
        <h1 className="mb-12 font-display text-4xl font-medium md:text-5xl">My Wishlist</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="group relative">
              <Link to={`/product/${item.slug}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>

              <div className="mt-4 space-y-1">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </p>
                <Link to={`/product/${item.slug}`}>
                  <h3 className="font-display text-lg font-medium hover:underline">{item.name}</h3>
                </Link>
                <p className="font-body text-base font-medium">₹{item.price}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    removeFromWishlist(item.id);
                    toast.info("Removed from wishlist");
                  }}
                  className="flex h-12 w-full items-center justify-center border border-border transition-colors hover:border-destructive hover:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
