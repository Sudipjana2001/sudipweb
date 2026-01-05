import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  const handleAddToCart = (item: typeof wishlistItems[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      ownerSize: "M",
      petSize: "M",
    });
    toast.success("Added to cart!", {
      description: "Default sizes selected. You can adjust in cart.",
    });
  };

  if (wishlistItems.length === 0) {
    return (
      <PageLayout showNewsletter={false}>
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
      <div className="container mx-auto px-6 py-6 md:py-8">
        <h1 className="mb-12 font-display text-4xl font-medium md:text-5xl">My Wishlist</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item) => (
            <div key={item.id} className="group relative">
              <Link to={`/product/${item.id}`}>
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
                <Link to={`/product/${item.id}`}>
                  <h3 className="font-display text-lg font-medium hover:underline">{item.name}</h3>
                </Link>
                <p className="font-body text-base font-medium">${item.price}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => handleAddToCart(item)}
                  variant="hero"
                  className="flex-1 gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </Button>
                <button
                  onClick={() => {
                    removeFromWishlist(item.id);
                    toast.info("Removed from wishlist");
                  }}
                  className="flex h-12 w-12 items-center justify-center border border-border transition-colors hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
