/**
 * Value object for order total calculations.
 * Encapsulates all pricing rules in one place.
 * 
 * This is immutable - create a new instance for different values.
 * 
 * @example
 * const orderTotal = new OrderTotal(500, 50, 5);
 * console.log(orderTotal.total); // Final total with all costs
 * const breakdown = orderTotal.getBreakdown();
 */
export class OrderTotal {
  private static readonly FREE_SHIPPING_THRESHOLD = 100;
  private static readonly SHIPPING_COST = 10;
  private static readonly TAX_RATE = 0.08;

  constructor(
    private readonly subtotal: number,
    private readonly couponDiscount: number = 0,
    private readonly giftWrapCost: number = 0
  ) {}

  /**
   * Calculate shipping cost based on subtotal
   */
  get shippingCost(): number {
    return this.subtotal >= OrderTotal.FREE_SHIPPING_THRESHOLD
      ? 0
      : OrderTotal.SHIPPING_COST;
  }

  /**
   * Get the amount subject to tax
   */
  get taxableAmount(): number {
    return Math.max(0, this.subtotal - this.couponDiscount + this.giftWrapCost);
  }

  /**
   * Calculate tax amount
   */
  get tax(): number {
    return this.taxableAmount * OrderTotal.TAX_RATE;
  }

  /**
   * Calculate final total
   */
  get total(): number {
    return this.taxableAmount + this.shippingCost + this.tax;
  }

  /**
   * Check if order qualifies for free shipping
   */
  get hasFreeShipping(): boolean {
    return this.subtotal >= OrderTotal.FREE_SHIPPING_THRESHOLD;
  }

  /**
   * Get amount remaining for free shipping
   */
  get amountToFreeShipping(): number {
    if (this.hasFreeShipping) return 0;
    return OrderTotal.FREE_SHIPPING_THRESHOLD - this.subtotal;
  }

  /**
   * Get all breakdown values for display
   */
  getBreakdown(): OrderBreakdown {
    return {
      subtotal: this.subtotal,
      couponDiscount: this.couponDiscount,
      shippingCost: this.shippingCost,
      giftWrapCost: this.giftWrapCost,
      tax: this.tax,
      total: this.total,
      hasFreeShipping: this.hasFreeShipping,
      amountToFreeShipping: this.amountToFreeShipping,
    };
  }

  /**
   * Create a new OrderTotal with updated coupon discount
   */
  withCouponDiscount(discount: number): OrderTotal {
    return new OrderTotal(this.subtotal, discount, this.giftWrapCost);
  }

  /**
   * Create a new OrderTotal with gift wrap
   */
  withGiftWrap(cost: number): OrderTotal {
    return new OrderTotal(this.subtotal, this.couponDiscount, cost);
  }

  /**
   * Static helper to get the free shipping threshold
   */
  static getFreeShippingThreshold(): number {
    return OrderTotal.FREE_SHIPPING_THRESHOLD;
  }

  /**
   * Static helper to get the tax rate as percentage
   */
  static getTaxRatePercentage(): number {
    return OrderTotal.TAX_RATE * 100;
  }
}

export interface OrderBreakdown {
  subtotal: number;
  couponDiscount: number;
  shippingCost: number;
  giftWrapCost: number;
  tax: number;
  total: number;
  hasFreeShipping: boolean;
  amountToFreeShipping: number;
}
