import { supabase } from '@/integrations/client';
import { Coupon, CouponRecord, CouponValidationResult } from '@/domain/models/Coupon';

/**
 * CouponService handles all coupon-related business operations.
 * Uses the Coupon domain model for validation logic.
 * 
 * @example
 * const service = new CouponService(userId);
 * const result = await service.validateCoupon('SAVE20', 150);
 * if (result.valid) {
 *   await service.applyCoupon(coupon.id, orderId, result.discount);
 * }
 */
export class CouponService {
  constructor(private readonly userId: string | null) {}

  /**
   * Validate a coupon code against an order amount
   */
  async validateCoupon(
    code: string,
    orderAmount: number
  ): Promise<CouponValidationResult & { coupon?: Coupon }> {
    // Find coupon by code
    const { data: couponRecord, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !couponRecord) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    // Create domain model from record
    const coupon = Coupon.fromRecord(couponRecord as CouponRecord);

    // Get user's usage count for this coupon
    let userUsageCount = 0;
    if (this.userId) {
      const { count } = await supabase
        .from('coupon_uses')
        .select('id', { count: 'exact' })
        .eq('coupon_id', coupon.id)
        .eq('user_id', this.userId);

      userUsageCount = count || 0;
    }

    // Validate using domain model
    const validation = coupon.validate(orderAmount, userUsageCount);

    if (validation.valid) {
      return {
        ...validation,
        coupon,
      };
    }

    return validation;
  }

  /**
   * Apply a coupon to an order (record usage)
   */
  async applyCoupon(
    couponId: string,
    orderId: string | null,
    discountApplied: number
  ): Promise<void> {
    if (!this.userId) {
      throw new Error('Not authenticated');
    }

    // Record usage
    await supabase.from('coupon_uses').insert({
      coupon_id: couponId,
      user_id: this.userId,
      order_id: orderId,
      discount_applied: discountApplied,
    });

    // Increment uses_count on the coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('uses_count')
      .eq('id', couponId)
      .single();

    await supabase
      .from('coupons')
      .update({ uses_count: (coupon?.uses_count || 0) + 1 })
      .eq('id', couponId);
  }

  /**
   * Get all active coupons
   */
  async getActiveCoupons(): Promise<Coupon[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }

    return (data || []).map((record) => Coupon.fromRecord(record as CouponRecord));
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return Coupon.fromRecord(data as CouponRecord);
  }
}
