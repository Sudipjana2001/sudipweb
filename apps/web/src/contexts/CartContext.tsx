import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "./AuthContext";
import { CartService } from "@/services/CartService";
import { CartItemModel } from "@/domain/models/CartItem";

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

  // Create service instance (memoized per user)
  const cartService = new CartService(user?.id ?? null);

  // Load cart and wishlist from Supabase on login
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setWishlistItems([]);
      return;
    }

    const loadUserData = async () => {
      // Load Cart using CartService
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
      await cartService.addItem({ ...item, ownerSize, petSize });
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
      await cartService.removeItem(id, normalizedOwnerSize, normalizedPetSize);
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
      await cartService.updateQuantity(id, normalizedOwnerSize, normalizedPetSize, quantity);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      await cartService.clearCart();
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
