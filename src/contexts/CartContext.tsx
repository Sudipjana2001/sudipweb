import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  ownerSize: string;
  petSize: string;
  quantity: number;
}

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number, ownerSize: string, petSize: string) => void;
  updateQuantity: (id: number, ownerSize: string, petSize: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.ownerSize === item.ownerSize && i.petSize === item.petSize
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.ownerSize === item.ownerSize && i.petSize === item.petSize
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number, ownerSize: string, petSize: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.id === id && i.ownerSize === ownerSize && i.petSize === petSize))
    );
  };

  const updateQuantity = (id: number, ownerSize: string, petSize: string, quantity: number) => {
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
  };

  const clearCart = () => setCartItems([]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: number) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
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
