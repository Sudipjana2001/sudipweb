/**
 * Coupon domain model with encapsulated business rules.
 * This class validates coupon eligibility and calculates discounts.
 * 
 * @example
 * const coupon = Coupon.fromRecord(couponData);
 * const result = coupon.validate(orderAmount, userUsageCount);
 * if (result.valid) {
 *   console.log(`Discount: ₹${result.discount}`);
 * }
 */
export class Coupon {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly description: string | null,
    public readonly discountType: 'percentage' | 'fixed',
    public readonly discountValue: number,
    public readonly minOrderAmount: number,
    public readonly maxUses: number | null,
    public readonly usesCount: number,
    public readonly maxUsesPerUser: number,
    public readonly startsAt: Date,
    public readonly expiresAt: Date | null,
    public readonly isActive: boolean,
    public readonly appliesTo: 'all' | 'category' | 'collection' | 'product' = 'all',
    public readonly appliesToIds: string[] = []
  ) {}

  /**
   * Factory method to create from raw database record
   */
  static fromRecord(record: CouponRecord): Coupon {
    return new Coupon(
      record.id,
      record.code,
      record.description,
      record.discount_type,
      record.discount_value,
      record.min_order_amount,
      record.max_uses,
      record.uses_count,
      record.max_uses_per_user,
      new Date(record.starts_at),
      record.expires_at ? new Date(record.expires_at) : null,
      record.is_active,
      record.applies_to || 'all',
      record.applies_to_ids || []
    );
  }

  /**
   * Check if coupon is currently within its valid date range
   */
  isWithinDateRange(now: Date = new Date()): boolean {
    if (this.startsAt > now) return false;
    if (this.expiresAt && this.expiresAt < now) return false;
    return true;
  }

  /**
   * Check if coupon has remaining uses
   */
  hasRemainingUses(): boolean {
    if (this.maxUses === null) return true;
    return this.usesCount < this.maxUses;
  }

  /**
   * Check if order meets minimum amount requirement
   */
  meetsMinimumOrder(orderAmount: number): boolean {
    return orderAmount >= this.minOrderAmount;
  }

  /**
   * Calculate discount amount for a given order total
   */
  calculateDiscount(orderAmount: number): number {
    if (this.discountType === 'percentage') {
      return (orderAmount * this.discountValue) / 100;
    }
    return Math.min(this.discountValue, orderAmount);
  }

  /**
   * Check if user has exceeded their usage limit
   */
  userCanUse(userUsageCount: number): boolean {
    return userUsageCount < this.maxUsesPerUser;
  }

  /**
   * Comprehensive validation with detailed error messages
   */
  validate(orderAmount: number, userUsageCount: number): CouponValidationResult {
    if (!this.isActive) {
      return { valid: false, message: 'This coupon is inactive' };
    }

    const now = new Date();
    if (this.startsAt > now) {
      return { valid: false, message: 'This coupon is not yet active' };
    }

    if (this.expiresAt && this.expiresAt < now) {
      return { valid: false, message: 'This coupon has expired' };
    }

    if (!this.hasRemainingUses()) {
      return { valid: false, message: 'This coupon has reached its usage limit' };
    }

    if (!this.meetsMinimumOrder(orderAmount)) {
      return {
        valid: false,
        message: `Minimum order amount is ₹${this.minOrderAmount}`,
      };
    }

    if (!this.userCanUse(userUsageCount)) {
      return { valid: false, message: 'You have already used this coupon' };
    }

    return {
      valid: true,
      discount: this.calculateDiscount(orderAmount),
    };
  }

  /**
   * Get a description of the discount for display
   */
  getDiscountDescription(): string {
    if (this.discountType === 'percentage') {
      return `${this.discountValue}% off`;
    }
    return `₹${this.discountValue} off`;
  }
}

export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  applies_to?: 'all' | 'category' | 'collection' | 'product';
  applies_to_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  discount?: number;
}
