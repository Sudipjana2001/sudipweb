import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CartService, CartTotals } from '@/services/CartService';
import { CartItemModel, CartItemData } from '@/domain/models/CartItem';

/**
 * Hook that provides CartService instance and memoized operations.
 * Acts as an adapter between OOP services and React components.
 * 
 * This hook is for direct service access. The CartContext still manages
 * the reactive state - this hook helps with operations that need the service directly.
 * 
 * @example
 * const { service, groupCartItems, normalizeSize } = useCartService();
 * const items = service.groupCartItems(rawData);
 */
export function useCartService() {
  const { user } = useAuth();

  // Memoize service instance to prevent recreation on every render
  const service = useMemo(() => {
    return new CartService(user?.id ?? null);
  }, [user?.id]);

  // Expose service methods as stable callbacks
  const addItem = useCallback(
    async (item: Omit<CartItemData, 'quantity'>) => {
      await service.addItem(item);
    },
    [service]
  );

  const removeItem = useCallback(
    async (productId: string | number, ownerSize: string, petSize: string) => {
      await service.removeItem(productId, ownerSize, petSize);
    },
    [service]
  );

  const updateQuantity = useCallback(
    async (productId: string | number, ownerSize: string, petSize: string, quantity: number) => {
      if (quantity < 1) {
        await service.removeItem(productId, ownerSize, petSize);
        return;
      }
      await service.updateQuantity(productId, ownerSize, petSize, quantity);
    },
    [service]
  );

  const clearCart = useCallback(async () => {
    await service.clearCart();
  }, [service]);

  const loadCart = useCallback(async () => {
    return await service.loadCart();
  }, [service]);

  // Utility methods from domain model
  const groupCartItems = useCallback(
    (rawItems: Parameters<CartService['groupCartItems']>[0]) => {
      return service.groupCartItems(rawItems);
    },
    [service]
  );

  return {
    service,
    isAuthenticated: service.isAuthenticated,
    // Async operations
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loadCart,
    // Data transformation
    groupCartItems,
    // Static utilities (no service instance needed)
    generateItemKey: CartItemModel.generateKey,
    normalizeSize: CartItemModel.normalizeSize,
    sizesMatch: CartItemModel.sizesMatch,
    calculateTotals: CartService.calculateTotals,
  };
}

export type { CartTotals, CartItemData };
