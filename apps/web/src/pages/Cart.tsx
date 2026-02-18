import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <PageLayout showNewsletter={false}>
        <div className="container mx-auto px-6 py-32 text-center">
          <ShoppingBag className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-4 font-display text-4xl font-medium">Your Cart is Empty</h1>
          <p className="mb-8 font-body text-muted-foreground">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link to="/shop">
            <Button variant="hero">
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNewsletter={false}>
      <SEOHead
        title="Shopping Cart"
        description="Review items in your Pebric shopping cart."
        noindex={true}
      />
      <div className="container mx-auto px-6 py-6 md:py-8">
        <h1 className="mb-12 font-display text-4xl font-medium md:text-5xl">Shopping Cart</h1>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="border-b border-border pb-4">
              <div className="hidden grid-cols-12 gap-4 font-body text-xs uppercase tracking-wider text-muted-foreground md:grid">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${item.ownerSize}-${item.petSize}`}
                  className="grid grid-cols-12 items-center gap-4 py-6"
                >
                  {/* Product */}
                  <div className="col-span-12 flex items-center gap-4 md:col-span-5">
                    <Link to={`/product/${item.slug}`} className="h-24 w-20 flex-shrink-0 overflow-hidden bg-muted">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/product/${item.slug}`}>
                        <h3 className="font-display text-lg font-medium hover:underline">{item.name}</h3>
                      </Link>
                      <p className="font-body text-sm text-muted-foreground">
                        Size: {item.ownerSize} / Pet: {item.petSize}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id, item.ownerSize, item.petSize)}
                        className="mt-2 flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-destructive md:hidden"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 flex items-center justify-center md:col-span-2">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => updateQuantity(item.id, item.ownerSize, item.petSize, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.ownerSize, item.petSize, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-4 text-center font-body md:col-span-2">
                    ₹{item.price}
                  </div>

                  {/* Total */}
                  <div className="col-span-4 text-right font-body font-medium md:col-span-2">
                    ₹{item.price * item.quantity}
                  </div>

                  {/* Remove (Desktop) */}
                  <div className="hidden justify-end md:col-span-1 md:flex">
                    <button
                      onClick={() => removeFromCart(item.id, item.ownerSize, item.petSize)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
              <Link to="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted p-6">
              <h2 className="mb-6 font-display text-xl font-medium">Order Summary</h2>

              <div className="space-y-4 border-b border-border pb-6">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{cartTotal >= 100 ? "Free" : "₹10"}</span>
                </div>
              </div>

              <div className="flex justify-between py-6">
                <span className="font-display text-lg font-medium">Total</span>
                <span className="font-display text-lg font-medium">
                  ₹{cartTotal >= 100 ? cartTotal : cartTotal + 10}
                </span>
              </div>

              <Link to="/checkout">
                <Button variant="hero" className="w-full">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="mt-4 text-center font-body text-xs text-muted-foreground">
                Free shipping on orders over ₹100
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
