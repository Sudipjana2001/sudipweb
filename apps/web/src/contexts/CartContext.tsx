import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "./AuthContext";
import { CartService } from "@/services/CartService";
import { CartItemModel } from "@/domain/models/CartItem";
import { toast } from "sonner";

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
  removeFromCart: (id: number | string, ownerSize: string, petSize: string) => void;
  updateQuantity: (id: number | string, ownerSize: string, petSize: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number | string) => void;
  isInWishlist: (id: number | string) => boolean;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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
  const { user } = useAuth();
  const [isMerged, setIsMerged] = useState(false);

  // Create service instance (memoized per user)
  const cartService = new CartService(user?.id ?? null);
  
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
      return;
    }

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
              slug: item.slug
            });
            // Update quantity if > 1
            if (item.quantity > 1) {
              await cartService.updateQuantity(item.id, item.ownerSize, item.petSize, item.quantity);
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
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            images,
            slug
          )
        `)
        .eq("user_id", user.id);

      if (cartData) {
        // Use CartService to group items
        const groupedItems = cartService.groupCartItems(cartData as any);
        setCartItems(groupedItems);
      }

      // 3. Load Wishlist
      const { data: wishlistData } = await supabase
        .from("wishlist_items")
        .select(`
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
        `)
        .eq("user_id", user.id);

      if (wishlistData) {
        setWishlistItems(
          wishlistData.map((item: any) => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image_url,
            category: item.product.category?.name || "Product",
            slug: item.product.slug,
          })) as any
        );
      }
    };

    syncAndLoadData();
  }, [user]);

  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    // Normalize sizes using domain model
    const ownerSize = CartItemModel.normalizeSize(item.ownerSize);
    const petSize = CartItemModel.normalizeSize(item.petSize);

    // Optimistic update
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.ownerSize === ownerSize && i.petSize === petSize
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.ownerSize === ownerSize && i.petSize === petSize
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, ownerSize, petSize, quantity: 1, slug: item.slug }];
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

  const removeFromCart = async (id: number | string, ownerSize: string, petSize: string) => {
    // Normalize sizes
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    // Optimistic update
    setCartItems((prev) =>
      prev.filter((i) => !(i.id === id && i.ownerSize === normalizedOwnerSize && i.petSize === normalizedPetSize))
    );

    // Sync with database using CartService
    if (user) {
      try {
        await cartService.removeItem(id, normalizedOwnerSize, normalizedPetSize);
      } catch (error) {
        console.error("Failed to sync cart:", error);
      }
    }
  };

  const updateQuantity = async (id: number | string, ownerSize: string, petSize: string, quantity: number) => {
    const normalizedOwnerSize = CartItemModel.normalizeSize(ownerSize);
    const normalizedPetSize = CartItemModel.normalizeSize(petSize);

    if (quantity < 1) {
      removeFromCart(id, normalizedOwnerSize, normalizedPetSize);
      return;
    }

    // Optimistic update
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id && i.ownerSize === normalizedOwnerSize && i.petSize === normalizedPetSize
          ? { ...i, quantity }
          : i
      )
    );

    // Sync with database using CartService
    if (user) {
      try {
        await cartService.updateQuantity(id, normalizedOwnerSize, normalizedPetSize, quantity);
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

  const isInWishlist = (id: number | string) => wishlistItems.some((i) => i.id === id);

  // Use CartService static method for totals calculation
  const { subtotal: cartTotal, itemCount: cartCount } = CartService.calculateTotals(cartItems);

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
