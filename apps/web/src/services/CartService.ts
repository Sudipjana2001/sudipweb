import { supabase } from '@/integrations/client';
import { CartItemModel, CartItemData, RawCartItemRecord } from '@/domain/models/CartItem';

/**
 * CartService handles all cart-related business operations.
 * Encapsulates Supabase interactions and business logic.
 * 
 * This is a pure service class - no React dependencies.
 * Use the useCartService hook to integrate with React components.
 * 
 * @example
 * const service = new CartService(userId);
 * await service.addItem(item);
 * const items = await service.loadCart();
 */
export class CartService {
  constructor(private readonly userId: string | null) {}

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.userId !== null;
  }

  /**
   * Load cart items from database
   */
  async loadCart(): Promise<CartItemData[]> {
    if (!this.userId) return [];

    const { data: cartData, error } = await supabase
      .from('cart_items')
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
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error loading cart:', error);
      return [];
    }

    if (!cartData) return [];

    return this.groupCartItems(cartData as RawCartItemRecord[]);
  }

  /**
   * Group raw cart data by product-size combination
   */
  groupCartItems(rawItems: RawCartItemRecord[]): CartItemData[] {
    const groupedItems = new Map<string, CartItemModel>();

    rawItems.forEach((record) => {
      const item = CartItemModel.fromDatabaseRecord(record);
      const key = item.key;

      if (groupedItems.has(key)) {
        const existing = groupedItems.get(key)!;
        groupedItems.set(key, existing.withQuantity(existing.quantity + item.quantity));
      } else {
        groupedItems.set(key, item);
      }
    });

    return Array.from(groupedItems.values()).map((item) => item.toPlainObject());
  }

  /**
   * Add item to cart in database
   */
  async addItem(item: Omit<CartItemData, 'quantity'>): Promise<void> {
    if (!this.userId) return;

    const ownerSize = CartItemModel.normalizeSize(item.ownerSize);
    const petSize = CartItemModel.normalizeSize(item.petSize);

    // Check if item already exists
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', this.userId)
      .eq('product_id', item.id as string)
      .eq('size', ownerSize)
      .eq('pet_size', petSize)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: this.userId,
        product_id: item.id as string,
        quantity: 1,
        size: ownerSize,
        pet_size: petSize,
      });
    }
  }

  /**
   * Remove item from cart in database
   */
  async removeItem(productId: string | number, ownerSize: string, petSize: string): Promise<void> {
    if (!this.userId) return;

    try {
      // Fetch candidates first to handle N/A matching
      const { data: candidates, error: fetchError } = await supabase
        .from('cart_items')
        .select('id, size, pet_size')
        .eq('user_id', this.userId)
        .eq('product_id', productId as string);

      if (fetchError) {
        console.error('Error fetching items for deletion:', fetchError);
        return;
      }

      if (!candidates || candidates.length === 0) {
        console.warn('No matching cart items found in DB to delete.');
        return;
      }

      // Filter using domain model's size matching logic
      const idsToDelete = candidates
        .filter((c) =>
          CartItemModel.sizesMatch(ownerSize, c.size) &&
          CartItemModel.sizesMatch(petSize, c.pet_size)
        )
        .map((c) => c.id);

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Error deleting cart items:', deleteError);
        }
      }
    } catch (err) {
      console.error('Unexpected error in removeItem:', err);
    }
  }

  /**
   * Update item quantity in database
   */
  async updateQuantity(
    productId: string | number,
    ownerSize: string,
    petSize: string,
    quantity: number
  ): Promise<void> {
    if (!this.userId) return;

    let query = supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', this.userId)
      .eq('product_id', productId as string);

    // Handle N/A size matching using PostgREST OR syntax
    if (ownerSize === 'N/A') {
      query = query.or('size.is.null,size.eq.,size.eq.N/A');
    } else {
      query = query.eq('size', ownerSize);
    }

    if (petSize === 'N/A') {
      query = query.or('pet_size.is.null,pet_size.eq.,pet_size.eq.N/A');
    } else {
      query = query.eq('pet_size', petSize);
    }

    await query;
  }

  /**
   * Clear all items from user's cart
   */
  async clearCart(): Promise<void> {
    if (!this.userId) return;
    await supabase.from('cart_items').delete().eq('user_id', this.userId);
  }

  /**
   * Calculate cart totals
   */
  static calculateTotals(items: CartItemData[]): CartTotals {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      itemCount,
      subtotal,
    };
  }
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
}
