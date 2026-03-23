import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "./AuthContext";
import { CartService } from "@/services/CartService";
import {
  CartItemModel,
  type RawCartItemRecord,
} from "@/domain/models/CartItem";
import { toast } from "sonner";
import { useRealtimeChannel } from "@/hooks/useRealtime";
import {
  clearTrackedAbandonedCart,
  getAbandonedCartSessionId,
  trackAbandonedCartSnapshot,
} from "@/hooks/useAbandonedCarts";
import type { Database } from "@/integrations/types";

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  ownerSize: string;
  petSize: string;
  quantity: number;
  slug: string;
}

export interface WishlistItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  category: string;
  slug: string;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (
    id: number | string,
    ownerSize: string,
    petSize: string,
  ) => void;
  updateQuantity: (
    id: number | string,
    ownerSize: string,
    petSize: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number | string) => void;
  isInWishlist: (id: number | string) => boolean;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type WishlistQueryRow = {
  product:
    | (Pick<
        Database["public"]["Tables"]["products"]["Row"],
        "id" | "name" | "price" | "image_url" | "slug"
      > & {
        category?: { name: string | null } | null;
      })
    | null;
};

function mapWishlistItems(rows: WishlistQueryRow[]): WishlistItem[] {
  return rows
    .filter(
      (
        item,
      ): item is WishlistQueryRow & {
        product: NonNullable<WishlistQueryRow["product"]>;
      } => Boolean(item.product),
    )
    .map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image_url || "",
      category: item.product.category?.name || "Product",
      slug: item.product.slug,
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Load state from localStorage if available (for guests)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guest_cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const { user, profile } = useAuth();
  const [isMerged, setIsMerged] = useState(false);
  const [isCartReady, setIsCartReady] = useState(false);
  const abandonedCartSessionIdRef = useRef<string | null>(
    typeof window !== "undefined" ? getAbandonedCartSessionId() : null,
  );
  const previousUserIdRef = useRef<string | null>(user?.id ?? null);
  const previousEmailRef = useRef<string | null>(
    profile?.email || user?.email || null,
  );
  const previousCartItemsRef = useRef<CartItem[]>(cartItems);
  const skipNextEmptyCartClearRef = useRef(false);

  // Create service instance (memoized per user)
  const cartService = useMemo(
    () => new CartService(user?.id ?? null),
    [user?.id],
  );

  // Sync guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem("guest_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Load cart and wishlist from Supabase on login, and merge guest cart
  useEffect(() => {
    if (!user) {
      // If user logs out, we keep the current state (which effectively becomes the persistent guest cart if they continue shopping)
      // Or we could revert to the 'guest_cart' from before login?
      // Standard behavior: clear or keep empty.
      // Let's reload from guest_cart in case there was a session overlap, or just rely on state.
      // But usually logout clears the UI.
      const saved = localStorage.getItem("guest_cart");
      setCartItems(saved ? JSON.parse(saved) : []);
      setWishlistItems([]);
      setIsMerged(false);
      setIsCartReady(true);
      return;
    }

    setIsCartReady(false);

    const syncAndLoadData = async () => {
      // 1. Merge Strategy: Check for guest cart items to sync
      const guestCartJson = localStorage.getItem("guest_cart");
      if (guestCartJson && !isMerged) {
        const guestItems: CartItem[] = JSON.parse(guestCartJson);
        if (guestItems.length > 0) {
          // Push guest items to Supabase
          // We use sequential operations to ensure correctness
          for (const item of guestItems) {
            await cartService.addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              ownerSize: item.ownerSize,
              petSize: item.petSize,
              slug: item.slug,
            });
            // Update quantity if > 1
            if (item.quantity > 1) {
              await cartService.updateQuantity(
                item.id,
                item.ownerSize,
                item.petSize,
                item.quantity,
              );
            }
          }
          // Clear guest cart after successful sync
          localStorage.removeItem("guest_cart");
        }
        setIsMerged(true); // Prevent re-merging in same session
      }

      // 2. Load Cart from DB (now includes merged items)
      const { data: cartData } = await supabase
        .from("cart_items")
        .select(
          `
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            images,
            slug
          )
        `,
        )
        .eq("user_id", user.id);

      if (cartData) {
        // Use CartService to group items
        const groupedItems = cartService.groupCartItems(
          cartData as RawCartItemRecord[],
        );
        setCartItems(groupedItems);
      }

      // 3. Load Wishlist
      const { data: wishlistData } = await supabase
        .from("wishlist_items")
        .select(
          `
          product:products (
            id,
            name,
            price,
            name,
            price,
            image_url,
            slug,
            category:categories(name)
          )
        `,
        )
        .eq("user_id", user.id);

      if (wishlistData) {
        setWishlistItems(mapWishlistItems(wishlistData as WishlistQueryRow[]));
      }
    };

    syncAndLoadData().finally(() => {
      setIsCartReady(true);
    });
  }, [cartService, isMerged, user]);

  useEffect(() => {
    if (!isCartReady || typeof document === "undefined") return;

    if (!abandonedCartSessionIdRef.current) {
      abandonedCartSessionIdRef.current = getAbandonedCartSessionId();
    }

    const identity = {
      userId: user?.id,
      sessionId: abandonedCartSessionIdRef.current,
    };

    const clearTrackedCart = () => {
      void clearTrackedAbandonedCart(identity).catch((error) => {
        console.warn("Failed to clear abandoned cart tracking:", error);
      });
    };

    if (cartItems.length === 0) {
      if (skipNextEmptyCartClearRef.current) {
        skipNextEmptyCartClearRef.current = false;
        return;
      }

      clearTrackedCart();
      return;
    }

    const trackCurrentCart = () => {
      void trackAbandonedCartSnapshot({
        ...identity,
        email: profile?.email || user?.email,
        cart_total: cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
        cart_items: cartItems.map((item) => ({
          product_id: String(item.id),
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          image_url: item.image,
        })),
      }).catch((error) => {
        console.warn("Failed to track abandoned cart:", error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackCurrentCart();
      }
    };

    const handlePageHide = () => {
      trackCurrentCart();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [cartItems, isCartReady, profile?.email, user?.email, user?.id]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    const userJustLoggedOut = Boolean(previousUserId) && !user?.id;

    if (
      userJustLoggedOut &&
      previousCartItemsRef.current.length > 0 &&
      abandonedCartSessionIdRef.current
    ) {
      skipNextEmptyCartClearRef.current = true;

      void trackAbandonedCartSnapshot({
        userId: previousUserId,
        sessionId: abandonedCartSessionIdRef.current,
        email: previousEmailRef.current || undefined,
        cart_total: previousCartItemsRef.current.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
        cart_items: previousCartItemsRef.current.map((item) => ({
          product_id: String(item.id),
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          image_url: item.image,
        })),
      }).catch((error) => {
        console.warn("Failed to track abandoned cart on logout:", error);
      });
    }

    previousUserIdRef.current = user?.id ?? null;
    previousEmailRef.current = profile?.email || user?.email || null;
    previousCartItemsRef.current = cartItems;
  }, [cartItems, profile?.email, user?.email, user?.id]);

  useRealtimeChannel(
    user ? `cart-wishlist-realtime-${user.id}` : "cart-wishlist-realtime-guest",
    user
      ? [
          { table: "cart_items", event: "*", filter: `user_id=eq.${user.id}` },
          {
            table: "wishlist_items",
            event: "*",
            filter: `user_id=eq.${user.id}`,
          },
        ]
      : [],
    async () => {
      if (!user) return;

      // Reload cart
      const { data: cartData } = await supabase
        .from("cart_items")
        .select(
          `
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            images,
            slug
          )
        `,
        )
        .eq("user_id", user.id);

      if (cartData) {
        const groupedItems = cartService.groupCartItems(
          cartData as RawCartItemRecord[],
        );
        setCartItems(groupedItems);
      }

      // Reload wishlist
      const { data: wishlistData } = await supabase
        .from("wishlist_items")
        .select(
          `
          product:products (
            id,
            name,
            price,
            image_url,
            slug,
            category:categories(name)
          )
        `,
        )
        .eq("user_id", user.id);

      if (wishlistData) {
        setWishlistItems(mapWishlistItems(wishlistData as WishlistQueryRow[]));
      }
    },
    !!user,
  );

  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    // Normalize sizes using domain model
    const ownerSize = CartItemModel.normalizeSize(item.ownerSize);
    const petSize = CartItemModel.normalizeSize(item.petSize);

    // Optimistic update
    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          i.ownerSize === ownerSize &&
          i.petSize === petSize,
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.ownerSize === ownerSize && i.petSize === petSize
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        { ...item, ownerSize, petSize, quantity: 1, slug: item.slug },
      ];
    });

    // Sync with database using CartService
    if (user) {
      try {
        await cartService.addItem({ ...item, ownerSize, petSize });
      } catch (error) {
        console.error("Failed to sync cart:", error);
        toast.error("Failed to save to account. Please check your connection.");
      }
    }
  };

  const removeFromCart = async (
    id: number | string,
    ownerSize: string,
    petSize: string,
  ) => {
    // Normalize sizes
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    // Optimistic update
    setCartItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.id === id &&
            i.ownerSize === normalizedOwnerSize &&
            i.petSize === normalizedPetSize
          ),
      ),
    );

    // Sync with database using CartService
    if (user) {
      try {
        await cartService.removeItem(
          id,
          normalizedOwnerSize,
          normalizedPetSize,
        );
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }
    }
  };

  const updateQuantity = async (
    id: number | string,
    ownerSize: string,
    petSize: string,
    quantity: number,
  ) => {
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    if (quantity < 1) {
      removeFromCart(id, normalizedOwnerSize, normalizedPetSize);
      return;
    }

    // Optimistic update
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id &&
        i.ownerSize === normalizedOwnerSize &&
        i.petSize === normalizedPetSize
          ? { ...i, quantity }
          : i,
      ),
    );

    // Sync with database using CartService
    if (user) {
      try {
        await cartService.updateQuantity(
          id,
          normalizedOwnerSize,
          normalizedPetSize,
          quantity,
        );
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      try {
        await cartService.clearCart();
      } catch (error) {
        console.error("Failed to clear cart DB:", error);
      }
    }
  };

  const addToWishlist = async (item: WishlistItem) => {
    setWishlistItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });

    if (user) {
      const { error } = await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: item.id as unknown as string,
      });
      // Ignore duplicate key error if it happens due to race condition
    }
  };

  const removeFromWishlist = async (id: number | string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));

    if (user) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id as unknown as string);
    }
  };

  const isInWishlist = (id: number | string) =>
    wishlistItems.some((i) => i.id === id);

  // Use CartService static method for totals calculation
  const { subtotal: cartTotal, itemCount: cartCount } =
    CartService.calculateTotals(cartItems);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
