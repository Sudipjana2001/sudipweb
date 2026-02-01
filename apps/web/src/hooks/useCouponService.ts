import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CouponService } from '@/services/CouponService';
import { Coupon, CouponValidationResult } from '@/domain/models/Coupon';
import { toast } from 'sonner';

/**
 * Hook that provides CouponService instance and memoized operations.
 * Acts as an adapter between OOP services and React components.
 * 
 * Maintains the same API as the original useCoupons hooks but
 * delegates to the CouponService for business logic.
 * 
 * @example
 * const { validateCoupon, applyCoupon } = useCouponService();
 * const result = await validateCoupon.mutateAsync({ code: 'SAVE20', orderAmount: 150 });
 */
export function useCouponService() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Memoize service instance
  const service = useMemo(() => {
    return new CouponService(user?.id ?? null);
  }, [user?.id]);

  // Validate coupon mutation
  const validateCoupon = useMutation({
    mutationFn: async ({
      code,
      orderAmount,
    }: {
      code: string;
      orderAmount: number;
    }): Promise<CouponValidationResult & { coupon?: Coupon }> => {
      return service.validateCoupon(code, orderAmount);
    },
  });

  // Apply coupon mutation
  const applyCoupon = useMutation({
    mutationFn: async ({
      couponId,
      orderId,
      discountApplied,
    }: {
      couponId: string;
      orderId?: string;
      discountApplied: number;
    }) => {
      await service.applyCoupon(couponId, orderId || null, discountApplied);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  // Get active coupons
  const getActiveCoupons = useCallback(async () => {
    return service.getActiveCoupons();
  }, [service]);

  // Get coupon by ID
  const getCouponById = useCallback(
    async (id: string) => {
      return service.getCouponById(id);
    },
    [service]
  );

  return {
    service,
    validateCoupon,
    applyCoupon,
    getActiveCoupons,
    getCouponById,
  };
}

export type { Coupon, CouponValidationResult };
