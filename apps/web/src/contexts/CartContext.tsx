import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "./AuthContext";

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const { user } = useAuth();

  // Load cart and wishlist from Supabase on login
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setWishlistItems([]);
      return;
    }

    const loadUserData = async () => {
      // Load Cart
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
          )
        `)
        .eq("user_id", user.id);

      if (cartData) {
        const groupedItems = new Map<string, CartItem>();

        cartData.forEach((item: any) => {
          const id = item.product.id;
          const ownerSize = item.size || "N/A";
          const petSize = item.pet_size || "N/A";
          const key = `${id}-${ownerSize}-${petSize}`;

          if (groupedItems.has(key)) {
            const existing = groupedItems.get(key)!;
            existing.quantity += item.quantity;
          } else {
            groupedItems.set(key, {
              id,
              name: item.product.name,
              price: item.product.price,
              image: item.product.image_url || item.product.images?.[0] || "",
              ownerSize,
              petSize,
              quantity: item.quantity,
              slug: item.product.slug,
            });
          }
        });

        setCartItems(Array.from(groupedItems.values()));
      }

      // Load Wishlist
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

    loadUserData();
  }, [user]);

  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    // Optimistic update
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.ownerSize === item.ownerSize && i.petSize === item.petSize
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.ownerSize === item.ownerSize && i.petSize === item.petSize
            ? { ...i, quantity: i.quantity + +1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, slug: item.slug }];
    });

    if (user) {
      // Sync with Supabase
      // First check if exists to update quantity, or insert new
      // We need to query by product_id, size, pet_size, user_id
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", item.id as unknown as string) // Assuming item.id is the UUID string
        .eq("size", item.ownerSize)
        .eq("pet_size", item.petSize)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: item.id as unknown as string,
          quantity: 1,
          size: item.ownerSize,
          pet_size: item.petSize,
        });
      }
    }
  };

  const removeFromCart = async (id: number, ownerSize: string, petSize: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.id === id && i.ownerSize === ownerSize && i.petSize === petSize))
    );

    if (user) {
      try {
        // Fetch all potential matches first to allow JS-side filtering
        const { data: candidates, error: fetchError } = await supabase
          .from("cart_items")
          .select("id, size, pet_size")
          .eq("user_id", user.id)
          .eq("product_id", id as unknown as string);

        if (fetchError) {
          console.error("Error fetching items for deletion:", fetchError);
          return;
        }

        if (!candidates || candidates.length === 0) {
          console.warn("No matching cart items found in DB to delete.");
          return;
        }

        // Filter candidates in JS to robustly handle "N/A" / null / empty
        const idsToDelete = candidates
          .filter((c) => {
            const dbSize = c.size || "N/A";
            const dbPetSize = c.pet_size || "N/A";
            
            // Normalize checks
            const sizeMatch = ownerSize === "N/A" 
              ? ["N/A", "", null].includes(c.size) 
              : c.size === ownerSize;
            
            const petSizeMatch = petSize === "N/A"
              ? ["N/A", "", null].includes(c.pet_size)
              : c.pet_size === petSize;

            return sizeMatch && petSizeMatch;
          })
          .map((c) => c.id);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("cart_items")
            .delete()
            .in("id", idsToDelete);

          if (deleteError) {
             console.error("Error deleting cart items:", deleteError);
          }
        }
      } catch (err) {
        console.error("Unexpected error in removeFromCart:", err);
      }
    }
  };

  const updateQuantity = async (id: number, ownerSize: string, petSize: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id, ownerSize, petSize);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id && i.ownerSize === ownerSize && i.petSize === petSize
          ? { ...i, quantity }
          : i
      )
    );

    if (user) {
      let query = supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", id as unknown as string);

      if (ownerSize === "N/A") {
        query = query.or("size.is.null,size.eq.,size.eq.N/A");
      } else {
        query = query.eq("size", ownerSize);
      }

      if (petSize === "N/A") {
        query = query.or("pet_size.is.null,pet_size.eq.,pet_size.eq.N/A");
      } else {
        query = query.eq("pet_size", petSize);
      }

      await query;
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
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

  const removeFromWishlist = async (id: number) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));

    if (user) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id as unknown as string);
    }
  };

  const isInWishlist = (id: number) => wishlistItems.some((i) => i.id === id);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
