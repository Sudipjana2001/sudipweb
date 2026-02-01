import { useMemo } from 'react';
import { OrderTotal, OrderBreakdown } from '@/domain/valueObjects/OrderTotal';

/**
 * Hook that provides OrderTotal value object for order calculations.
 * Encapsulates pricing logic (shipping, tax, discounts) in a domain object.
 * 
 * @param subtotal - Cart subtotal before discounts
 * @param couponDiscount - Discount amount from applied coupon
 * @param giftWrapCost - Cost of gift wrap if enabled
 * 
 * @example
 * const { orderTotal, breakdown, hasFreeShipping } = useOrderTotal(500, 50, 5);
 * console.log(breakdown.total); // Final total
 */
export function useOrderTotal(
  subtotal: number,
  couponDiscount: number = 0,
  giftWrapCost: number = 0
) {
  // Create memoized OrderTotal instance
  const orderTotal = useMemo(() => {
    return new OrderTotal(subtotal, couponDiscount, giftWrapCost);
  }, [subtotal, couponDiscount, giftWrapCost]);

  // Get breakdown (memoized since it depends on orderTotal)
  const breakdown = useMemo(() => {
    return orderTotal.getBreakdown();
  }, [orderTotal]);

  return {
    orderTotal,
    breakdown,
    // Convenience accessors
    shippingCost: breakdown.shippingCost,
    tax: breakdown.tax,
    total: breakdown.total,
    hasFreeShipping: breakdown.hasFreeShipping,
    amountToFreeShipping: breakdown.amountToFreeShipping,
    // Static helpers
    freeShippingThreshold: OrderTotal.getFreeShippingThreshold(),
    taxRatePercentage: OrderTotal.getTaxRatePercentage(),
  };
}

export type { OrderBreakdown };
