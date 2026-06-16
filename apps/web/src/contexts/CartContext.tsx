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
  type: "owner" | "pet" | "combo";  // ADD THIS
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
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (
    id: number | string,
    ownerSize: string,
    petSize: string,
    type: "owner" | "pet" | "combo",
  ) => Promise<void>;
  updateQuantity: (
    id: number | string,
    ownerSize: string,
    petSize: string,
    quantity: number,
    type: "owner" | "pet" | "combo",
  ) => Promise<void>;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number | string) => void;
  isInWishlist: (id: number | string) => boolean;
  cartTotal: number;
  cartCount: number;
  removeComboPart: (
    id: number | string,
    ownerSize: string,
    petSize: string,
    partToRemove: "owner" | "pet",
  ) => Promise<void>;
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
      const saved = localStorage.getItem("guest_cart");
      setCartItems(saved ? JSON.parse(saved) : []);
      setWishlistItems([]);
      setIsMerged(false);
      setIsCartReady(true);
      return;
    }

    setIsCartReady(false);

    const syncAndLoadData = async () => {
      const guestCartJson = localStorage.getItem("guest_cart");
      if (guestCartJson && !isMerged) {
        const guestItems: CartItem[] = JSON.parse(guestCartJson);
        if (guestItems.length > 0) {
          for (const item of guestItems) {
            await cartService.addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              ownerSize: item.ownerSize,
              petSize: item.petSize,
              slug: item.slug,
              type: item.type,
            });
            if (item.quantity > 1) {
              await cartService.updateQuantity(
                item.id,
                item.ownerSize,
                item.petSize,
                item.quantity,
              );
            }
          }
          localStorage.removeItem("guest_cart");
        }
        setIsMerged(true);
      }

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

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const ownerSize = CartItemModel.normalizeSize(item.ownerSize);
    const petSize = CartItemModel.normalizeSize(item.petSize);

    const isCombo = ownerSize !== "N/A" && petSize !== "N/A";

    let newItem: CartItem;

    if (isCombo) {
      newItem = {
        ...item,
        ownerSize,
        petSize,
        type: "combo" as const,
        price: item.price,
        name: item.name,
        quantity: 1,
      };
    } else if (ownerSize !== "N/A") {
      newItem = {
        ...item,
        ownerSize,
        petSize: "N/A",
        type: "owner" as const,
        price: item.price,
        name: item.name,
        quantity: 1,
      };
    } else {
      newItem = {
        ...item,
        ownerSize: "N/A",
        petSize,
        type: "pet" as const,
        price: item.price,
        name: item.name,
        quantity: 1,
      };
    }

    setCartItems((prev) => {
      let updated = [...prev];
      const existing = updated.find(
        (i) =>
          i.id === newItem.id &&
          i.ownerSize === newItem.ownerSize &&
          i.petSize === newItem.petSize &&
          i.type === newItem.type
      );
      if (existing) {
        updated = updated.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        updated.push({ ...newItem, quantity });
      }
      return updated;
    });

    if (user) {
      try {
        await cartService.addItem(newItem, quantity);
      } catch (error) {
        console.error("Failed to sync cart:", error);
        toast.error("Failed to save to account.");
      }
    }
  };

  const removeFromCart = async (
    id: number | string,
    ownerSize: string,
    petSize: string,
    type: "owner" | "pet" | "combo"
  ) => {
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    setCartItems((prev) =>
      prev.filter(
        (i) =>
          !(i.id === id &&
            i.ownerSize === normalizedOwnerSize &&
            i.petSize === normalizedPetSize &&
            i.type === type)
      ),
    );

    if (user) {
      try {
        await cartService.removeItem(id, normalizedOwnerSize, normalizedPetSize);
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }
    }
  };

  const removeComboPart = async (
    id: number | string,
    ownerSize: string,
    petSize: string,
    partToRemove: "owner" | "pet"
  ) => {
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    const comboItem = cartItems.find(
      (i) =>
        i.id === id &&
        i.ownerSize === normalizedOwnerSize &&
        i.petSize === normalizedPetSize &&
        i.type === "combo"
    );

    if (!comboItem) return;

    // 1. Remove the combo item from state
    setCartItems((prev) =>
      prev.filter(
        (i) =>
          !(i.id === id &&
            i.ownerSize === normalizedOwnerSize &&
            i.petSize === normalizedPetSize &&
            i.type === "combo")
      )
    );

    // 2. Remove the combo item from database
    if (user) {
      try {
        await cartService.removeItem(id, normalizedOwnerSize, normalizedPetSize);
      } catch (error) {
        console.error("Failed to sync cart removal:", error);
      }
    }

    // 3. Add the remaining item at 50% price
    const basePrice = comboItem.price;
    const halfPrice = Math.round(basePrice * 0.5);

    if (partToRemove === "owner") {
      // Keep pet part
      const petItem: CartItem = {
        id: comboItem.id,
        name: comboItem.name.replace(" (Matching Set)", "").replace(" (Combo)", "") + " (Pet Only)",
        price: halfPrice,
        image: comboItem.image,
        ownerSize: "N/A",
        petSize: normalizedPetSize,
        quantity: comboItem.quantity,
        slug: comboItem.slug,
        type: "pet",
      };

      setCartItems((prev) => [...prev, petItem]);

      if (user) {
        try {
          await cartService.addItem(petItem);
          if (petItem.quantity > 1) {
            await cartService.updateQuantity(
              petItem.id,
              petItem.ownerSize,
              petItem.petSize,
              petItem.quantity
            );
          }
        } catch (error) {
          console.error("Failed to sync new pet item:", error);
        }
      }
    } else {
      // Keep owner part
      const ownerItem: CartItem = {
        id: comboItem.id,
        name: comboItem.name.replace(" (Matching Set)", "").replace(" (Combo)", "") + " (Owner Only)",
        price: halfPrice,
        image: comboItem.image,
        ownerSize: normalizedOwnerSize,
        petSize: "N/A",
        quantity: comboItem.quantity,
        slug: comboItem.slug,
        type: "owner",
      };

      setCartItems((prev) => [...prev, ownerItem]);

      if (user) {
        try {
          await cartService.addItem(ownerItem);
          if (ownerItem.quantity > 1) {
            await cartService.updateQuantity(
              ownerItem.id,
              ownerItem.ownerSize,
              ownerItem.petSize,
              ownerItem.quantity
            );
          }
        } catch (error) {
          console.error("Failed to sync new owner item:", error);
        }
      }
    }
  };

  const updateQuantity = async (
    id: number | string,
    ownerSize: string,
    petSize: string,
    quantity: number,
    type: "owner" | "pet" | "combo"
  ) => {
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    if (quantity < 1) {
      await removeFromCart(
        id,
        normalizedOwnerSize,
        normalizedPetSize,
        type
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id &&
        i.ownerSize === normalizedOwnerSize &&
        i.petSize === normalizedPetSize
          ? { ...i, quantity }
          : i,
      ),
    );

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
      await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: item.id as unknown as string,
      });
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
        removeComboPart,
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







