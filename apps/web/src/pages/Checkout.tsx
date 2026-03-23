import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  ShieldCheck,
  Tag,
  X,
  Check,
} from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useValidateCoupon, useApplyCoupon, Coupon } from "@/hooks/useCoupons";
import {
  PaymentMethodSelector,
  PaymentMethod,
} from "@/components/PaymentMethodSelector";
import { useCreatePayment } from "@/hooks/usePayments";
import { useOrderTotal } from "@/hooks/useOrderTotal";
import { usePaytm, PaytmPaymentResponse } from "@/hooks/usePaytm";
import { usePhonePe } from "@/hooks/usePhonePe";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

const mapPaytmModeToMethod = (mode?: string | null): PaymentMethod | null => {
  if (!mode) return null;
  const normalized = mode.toUpperCase();
  if (normalized.includes("UPI")) return "upi";
  if (
    normalized.includes("CARD") ||
    normalized.includes("CC") ||
    normalized.includes("DC")
  )
    return "card";
  if (normalized.includes("NB") || normalized.includes("NETBANKING"))
    return "netbanking";
  if (normalized.includes("WALLET")) return "wallet";
  return null;
};

type AddressFormValues = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type CheckoutFormValues = AddressFormValues & {
  email: string;
  phone: string;
};

function ContactFields({
  prefix,
  values,
  onChange,
}: {
  prefix: string;
  values: Pick<CheckoutFormValues, "email" | "phone">;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input
          id={`${prefix}-email`}
          name="email"
          type="email"
          value={values.email}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-phone`}>Phone</Label>
        <Input
          id={`${prefix}-phone`}
          name="phone"
          type="tel"
          value={values.phone}
          onChange={onChange}
          required
        />
      </div>
    </div>
  );
}

function AddressFields({
  prefix,
  values,
  onChange,
  required = true,
}: {
  prefix: string;
  values: AddressFormValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${prefix}-firstName`}>First Name</Label>
          <Input
            id={`${prefix}-firstName`}
            name="firstName"
            value={values.firstName}
            onChange={onChange}
            required={required}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-lastName`}>Last Name</Label>
          <Input
            id={`${prefix}-lastName`}
            name="lastName"
            value={values.lastName}
            onChange={onChange}
            required={required}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${prefix}-address`}>Address</Label>
        <Input
          id={`${prefix}-address`}
          name="address"
          value={values.address}
          onChange={onChange}
          required={required}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${prefix}-city`}>City</Label>
          <Input
            id={`${prefix}-city`}
            name="city"
            value={values.city}
            onChange={onChange}
            required={required}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-postalCode`}>Postal Code</Label>
          <Input
            id={`${prefix}-postalCode`}
            name="postalCode"
            value={values.postalCode}
            onChange={onChange}
            required={required}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-country`}>Country</Label>
          <Input
            id={`${prefix}-country`}
            name="country"
            value={values.country}
            onChange={onChange}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const createOrder = useCreateOrder();

  const buyNowItems = location.state?.buyNowItems;

  // Use buyNowItems if present, otherwise use cartItems
  const checkoutItems = useMemo(() => {
    return buyNowItems && buyNowItems.length > 0 ? buyNowItems : cartItems;
  }, [buyNowItems, cartItems]);

  const activeTotal = useMemo(() => {
    if (buyNowItems && buyNowItems.length > 0) {
      return buyNowItems.reduce(
        (acc: number, item: { price: number; quantity: number }) =>
          acc + item.price * item.quantity,
        0,
      );
    }
    return cartTotal;
  }, [buyNowItems, cartTotal]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormValues>({
    email: user?.email || "",
    firstName: profile?.full_name?.split(" ")[0] || "",
    lastName: profile?.full_name?.split(" ").slice(1).join(" ") || "",
    address: profile?.address || "",
    city: profile?.city || "",
    postalCode: profile?.postal_code || "",
    country: profile?.country || "",
    phone: profile?.phone || "",
  });
  const [billingData, setBillingData] = useState<CheckoutFormValues>({
    email: user?.email || "",
    phone: profile?.phone || "",
    firstName: profile?.full_name?.split(" ")[0] || "",
    lastName: profile?.full_name?.split(" ").slice(1).join(" ") || "",
    address: profile?.address || "",
    city: profile?.city || "",
    postalCode: profile?.postal_code || "",
    country: profile?.country || "",
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  useEffect(() => {
    if (profile) {
      const parts = profile.full_name ? profile.full_name.split(" ") : [];
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user?.email || "",
        firstName: prev.firstName || (parts.length > 0 ? parts[0] : ""),
        lastName:
          prev.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
        address: prev.address || profile.address || "",
        city: prev.city || profile.city || "",
        postalCode: prev.postalCode || profile.postal_code || "",
        country: prev.country || profile.country || "",
        phone: prev.phone || profile.phone || "",
      }));
      setBillingData((prev) => ({
        email: prev.email || user?.email || "",
        phone: prev.phone || profile.phone || "",
        firstName: prev.firstName || (parts.length > 0 ? parts[0] : ""),
        lastName:
          prev.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
        address: prev.address || profile.address || "",
        city: prev.city || profile.city || "",
        postalCode: prev.postalCode || profile.postal_code || "",
        country: prev.country || profile.country || "",
      }));
    }
  }, [profile, user?.email]);

  useEffect(() => {
    if (!sameAsShipping) return;

    setBillingData({
      email: formData.email,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
    });
  }, [formData, sameAsShipping]);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const validateCoupon = useValidateCoupon();
  const applyCouponMutation = useApplyCoupon();
  const createPayment = useCreatePayment();
  const {
    openCheckout: openPaytmCheckout,
    verifyPayment: verifyPaytmPayment,
    isLoading: isPaytmLoading,
  } = usePaytm();
  const {
    openCheckout: openPhonePeCheckout,
    verifyPayment: verifyPhonePePayment,
    isLoading: isPhonePeLoading,
  } = usePhonePe();

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("phonepe");
  const codAvailable = true;
  const codFee = paymentMethod === "cod" ? 11 : 0;

  // Gift wrap state
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const giftWrapPrice = 5;

  // Use OrderTotal domain object for pricing calculations
  const giftWrapCost = giftWrap ? giftWrapPrice : 0;
  const {
    shippingCost,
    tax,
    codFee: appliedCodFee,
    total,
  } = useOrderTotal(activeTotal, couponDiscount, giftWrapCost, codFee);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    const result = await validateCoupon.mutateAsync({
      code: couponCode,
      orderAmount: activeTotal,
    });
    setIsValidating(false);

    if (result.valid && result.coupon && result.discount) {
      setAppliedCoupon(result.coupon);
      setCouponDiscount(result.discount);
      toast.success("Coupon applied!", {
        description: `You saved ₹${result.discount.toFixed(2)}`,
      });
    } else {
      toast.error(result.message || "Invalid coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
  };

  const handleShippingInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBillingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSameAsShippingChange = (checked: boolean | "indeterminate") => {
    const shouldMatch = checked === true;

    setBillingData({
      email: formData.email,
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
    });

    setSameAsShipping(shouldMatch);
  };

  const buildAddressPayload = (
    values: AddressFormValues,
    extras?: { phone?: string; email?: string },
  ) => ({
    full_name: `${values.firstName} ${values.lastName}`.trim(),
    firstName: values.firstName,
    lastName: values.lastName,
    address: values.address,
    city: values.city,
    postal_code: values.postalCode,
    postalCode: values.postalCode,
    country: values.country,
    phone: extras?.phone,
    email: extras?.email,
  });

  const buildShippingAddress = () =>
    buildAddressPayload(formData, {
      phone: formData.phone,
      email: formData.email,
    });

  const buildBillingAddress = () =>
    sameAsShipping
      ? buildShippingAddress()
      : buildAddressPayload(billingData, {
          phone: billingData.phone,
          email: billingData.email,
        });

  const buildOrderItems = () =>
    checkoutItems.map((item) => ({
      productId: item.id.toString(),
      productName: item.name,
      productImage: item.image,
      quantity: item.quantity,
      unitPrice: item.price,
      size: item.ownerSize,
      petSize: item.petSize,
    }));

  const finalizeOrder = async (
    transactionId?: string,
    gatewayPaymentMethod?: string,
    gatewayPaymentStatus?: string,
  ) => {
    const order = await createOrder.mutateAsync({
      items: buildOrderItems(),
      subtotal: activeTotal,
      shippingCost,
      tax,
      total,
      paymentMethod: gatewayPaymentMethod || paymentMethod,
      shippingAddress: buildShippingAddress(),
      billingAddress: buildBillingAddress(),
      giftWrap,
      giftMessage,
      giftWrapPrice,
      clearUserCart: !(buyNowItems && buyNowItems.length > 0),
    });

    if (order) {
      await createPayment.mutateAsync({
        orderId: order.id,
        amount: total,
        paymentMethod: gatewayPaymentMethod || paymentMethod,
        transactionId,
        paymentStatus: gatewayPaymentStatus,
      });

      if (appliedCoupon && couponDiscount > 0) {
        try {
          await applyCouponMutation.mutateAsync({
            coupon_id: appliedCoupon.id,
            order_id: order.id,
            discount_applied: couponDiscount,
          });
        } catch (e) {
          console.warn("Order placed but failed to record coupon usage:", e);
        }
      }
    }

    if (!(buyNowItems && buyNowItems.length > 0)) {
      clearCart();
    }

    return order;
  };

  // Handle returning from PhonePe payment
  // The effect depends on `user` so it fires once the auth session is loaded.
  // hasHandledCallback ref ensures it only acts once even though user may re-trigger the effect.
  const hasHandledCallback = useRef(false);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPhonePeCallback = urlParams.get("phonepe_callback") === "true";
    if (!isPhonePeCallback || hasHandledCallback.current) return;

    // Wait until the user auth session is loaded before proceeding
    if (!user) return;

    hasHandledCallback.current = true;
    // Clean up URL immediately so any re-render doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    const handlePhonePeCallback = async () => {
      const transactionId =
        urlParams.get("transactionId") ||
        sessionStorage.getItem("phonepe_merchant_transaction_id");

      if (!transactionId) {
        toast.error("Payment verification failed", {
          description: "Missing transaction reference.",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const verification = await verifyPhonePePayment(transactionId);

        if (!verification.verified) {
          toast.error("Payment not successful", {
            description: `Status: ${verification.status}. If amount was deducted, it will be refunded.`,
          });
          setIsSubmitting(false);
          return;
        }

        // Restore checkout snapshot saved before redirect (cart context not loaded yet)
        const snapshotJson = sessionStorage.getItem(
          "phonepe_checkout_snapshot",
        );
        if (!snapshotJson) {
          toast.error("Could not restore order data. Please contact support.", {
            description: `Transaction ID: ${transactionId}`,
          });
          setIsSubmitting(false);
          return;
        }

        const snapshot = JSON.parse(snapshotJson);
        const snapshotItems = snapshot.items as typeof checkoutItems;

        if (!snapshotItems || snapshotItems.length === 0) {
          toast.error("Your cart is empty, cannot create order post-payment.");
          setIsSubmitting(false);
          return;
        }

        // Build order items from snapshot (not from live cart context)
        const orderItems = snapshotItems.map((item) => ({
          productId: item.id.toString(),
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          unitPrice: item.price,
          size: item.ownerSize,
          petSize: item.petSize,
        }));

        const shippingAddress = {
          full_name: `${snapshot.formData.firstName} ${snapshot.formData.lastName}`,
          firstName: snapshot.formData.firstName,
          lastName: snapshot.formData.lastName,
          address: snapshot.formData.address,
          city: snapshot.formData.city,
          postal_code: snapshot.formData.postalCode,
          postalCode: snapshot.formData.postalCode,
          country: snapshot.formData.country,
          phone: snapshot.formData.phone,
          email: snapshot.formData.email,
        };
        const billingAddress =
          snapshot.sameAsShipping !== false || !snapshot.billingData
            ? shippingAddress
            : {
                full_name:
                  `${snapshot.billingData.firstName} ${snapshot.billingData.lastName}`.trim(),
                email: snapshot.billingData.email,
                phone: snapshot.billingData.phone,
                firstName: snapshot.billingData.firstName,
                lastName: snapshot.billingData.lastName,
                address: snapshot.billingData.address,
                city: snapshot.billingData.city,
                postal_code: snapshot.billingData.postalCode,
                postalCode: snapshot.billingData.postalCode,
                country: snapshot.billingData.country,
              };

        const resolvedMethod = verification.paymentMode || "phonepe";

        const order = await createOrder.mutateAsync({
          items: orderItems,
          subtotal: snapshot.subtotal,
          shippingCost: snapshot.shippingCost,
          tax: snapshot.tax,
          total: snapshot.total,
          paymentMethod: resolvedMethod,
          shippingAddress,
          billingAddress,
          giftWrap: snapshot.giftWrap,
          giftMessage: snapshot.giftMessage,
          giftWrapPrice: snapshot.giftWrapPrice ?? giftWrapPrice,
          clearUserCart: !(
            snapshot.buyNowItems && snapshot.buyNowItems.length > 0
          ),
        });

        if (order) {
          await createPayment.mutateAsync({
            orderId: order.id,
            amount: snapshot.total,
            paymentMethod: resolvedMethod,
            transactionId,
            paymentStatus: "completed",
          });

          if (snapshot.coupon?.id && snapshot.couponDiscount > 0) {
            try {
              await applyCouponMutation.mutateAsync({
                coupon_id: snapshot.coupon.id,
                order_id: order.id,
                discount_applied: snapshot.couponDiscount,
              });
            } catch (e) {
              console.warn(
                "Order placed but failed to record coupon usage:",
                e,
              );
            }
          }
        }

        if (!(snapshot.buyNowItems && snapshot.buyNowItems.length > 0)) {
          clearCart();
        }

        // Clean up sessionStorage
        sessionStorage.removeItem("phonepe_merchant_transaction_id");
        sessionStorage.removeItem("phonepe_checkout_snapshot");

        toast.success("Payment successful! Order placed.", {
          description: `Transaction ID: ${transactionId}`,
        });
        navigate("/orders");
      } catch (error: unknown) {
        console.error("PhonePe callback error:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to complete payment", {
          description:
            errMsg.length < 120
              ? errMsg
              : "Please contact support with your transaction ID.",
        });
        setIsSubmitting(false);
      }
    };

    handlePhonePeCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depends on user — waits for auth session to load before creating order

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to complete your order");
      navigate("/login");
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    // COD flow — direct order creation
    if (paymentMethod === "cod") {
      try {
        await finalizeOrder();
        toast.success("Order placed successfully!", {
          description: "Pay when you receive your order.",
        });
        navigate("/orders");
      } catch (error) {
        toast.error("Failed to place order", {
          description: "Please try again later.",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // PhonePe payment flow
    if (paymentMethod === "phonepe") {
      // Save a full checkout snapshot to sessionStorage BEFORE we navigate away.
      // When PhonePe redirects back, the cart context will be empty (async reload not done yet),
      // so we read this snapshot to reconstruct the order.
      const checkoutSnapshot = {
        items: checkoutItems,
        formData,
        billingData,
        sameAsShipping,
        subtotal: activeTotal,
        shippingCost,
        tax,
        total,
        couponDiscount,
        coupon: appliedCoupon
          ? { id: appliedCoupon.id, code: appliedCoupon.code }
          : null,
        giftWrap,
        giftMessage,
        giftWrapPrice,
        buyNowItems: buyNowItems || null,
      };
      sessionStorage.setItem(
        "phonepe_checkout_snapshot",
        JSON.stringify(checkoutSnapshot),
      );

      openPhonePeCheckout({
        amount: total,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerId: user.id || undefined,
        redirectUrl: `${window.location.origin}/checkout?phonepe_callback=true`,
        onFailure: (error: string) => {
          toast.error("Payment failed", {
            description: error,
          });
          setIsSubmitting(false);
        },
      });
      return;
    }

    // Online payment flow — Paytm checkout
    openPaytmCheckout({
      amount: total,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      customerId: user.id,
      onSuccess: async (response: PaytmPaymentResponse) => {
        try {
          const orderId = response.ORDERID;
          if (!orderId) {
            toast.error("Payment verification failed", {
              description: "Order reference missing from gateway response.",
            });
            setIsSubmitting(false);
            return;
          }

          const verification = await verifyPaytmPayment(orderId);
          if (!verification.verified) {
            toast.error("Payment verification failed", {
              description: "Please contact support if amount was deducted.",
            });
            setIsSubmitting(false);
            return;
          }

          const transactionId = verification.transactionId || response.TXNID;
          const resolvedMethod =
            mapPaytmModeToMethod(
              verification.paymentMode || response.PAYMENTMODE,
            ) || paymentMethod;

          await finalizeOrder(
            transactionId || undefined,
            resolvedMethod,
            "completed",
          );
          toast.success("Payment successful! Order placed.", {
            description: transactionId
              ? `Transaction ID: ${transactionId}`
              : "Paid via Paytm",
          });
          navigate("/orders");
        } catch (error) {
          toast.error("Failed to save order after payment", {
            description:
              "Payment was successful. Please contact support with your transaction ID.",
          });
        } finally {
          setIsSubmitting(false);
        }
      },
      onFailure: (error: string) => {
        toast.error("Payment failed", {
          description: error,
        });
        setIsSubmitting(false);
      },
    });
  };

  if (checkoutItems.length === 0) {
    return (
      <PageLayout showNewsletter={false}>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-4 font-display text-4xl font-medium">
            Your Cart is Empty
          </h1>
          <p className="mb-8 font-body text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
          <Link to="/shop">
            <Button variant="hero">Continue Shopping</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNewsletter={false}>
      <SEOHead
        title="Checkout"
        description="Complete your Pebric order securely."
        noindex={true}
      />
      <div className="container mx-auto px-6 py-6 md:py-8">
        <Link
          to="/cart"
          className="mb-8 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="mb-12 font-display text-4xl font-medium md:text-5xl">
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Shipping Address */}
              <div>
                <h2 className="mb-6 font-display text-xl font-medium">
                  Shipping Address
                </h2>
                <div className="mb-6">
                  <ContactFields
                    prefix="shipping"
                    values={formData}
                    onChange={handleShippingInputChange}
                  />
                </div>
                <AddressFields
                  prefix="shipping"
                  values={formData}
                  onChange={handleShippingInputChange}
                />
              </div>

              {/* Billing Address */}
              <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="font-display text-xl font-medium">
                    Billing Address
                  </h2>
                  <label className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Checkbox
                      checked={sameAsShipping}
                      onCheckedChange={handleSameAsShippingChange}
                    />
                    <span>Same as shipping address</span>
                  </label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-6">
                    <ContactFields
                      prefix="billing"
                      values={billingData}
                      onChange={handleBillingInputChange}
                    />
                    <AddressFields
                      prefix="billing"
                      values={billingData}
                      onChange={handleBillingInputChange}
                    />
                  </div>
                )}
                {sameAsShipping && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
                    <p className="font-body text-sm text-muted-foreground">
                      Your billing address will match your shipping address.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="border-t border-border pt-8">
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  codAvailable={codAvailable}
                  total={total}
                />
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-8">
                <div className="text-center">
                  <Truck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">
                    Free Shipping ₹100+
                  </p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">
                    Secure Checkout
                  </p>
                </div>
                <div className="text-center">
                  <CreditCard className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">
                    Safe Payment
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div className="sticky top-8 bg-muted p-6">
                <h2 className="mb-6 font-display text-xl font-medium">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="mb-6 space-y-4 border-b border-border pb-6">
                  {checkoutItems.map((item) => (
                    <div
                      key={`${item.id}-${item.ownerSize}-${item.petSize}`}
                      className="flex gap-4"
                    >
                      <div className="h-20 w-16 flex-shrink-0 overflow-hidden bg-background">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-body text-sm font-medium line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="font-body text-xs text-muted-foreground">
                          Size: {item.ownerSize} / Pet: {item.petSize}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-body text-sm font-medium">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon Code */}
                <div className="mb-6 border-b border-border pb-6">
                  <label className="mb-2 block font-body text-sm font-medium">
                    <Tag className="mr-1 inline h-4 w-4" />
                    Discount Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-body text-sm font-medium text-green-600">
                          {appliedCoupon.code}
                        </span>
                        <span className="font-body text-xs text-green-600/80">
                          (-₹{couponDiscount.toFixed(2)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                      >
                        {isValidating ? "..." : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-b border-border pb-6">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{activeTotal.toFixed(2)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between font-body text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingCost === 0
                        ? "Free"
                        : `₹${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  {appliedCodFee > 0 && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">COD Fee</span>
                      <span>₹{appliedCodFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between py-6">
                  <span className="font-display text-lg font-medium">
                    Total
                  </span>
                  <span className="font-display text-lg font-medium">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isSubmitting || isPhonePeLoading}
                >
                  {isSubmitting || isPaytmLoading || isPhonePeLoading
                    ? "Processing..."
                    : user
                      ? "Place Order"
                      : "Sign in to Checkout"}
                </Button>

                {!user && (
                  <p className="mt-4 text-center font-body text-xs text-muted-foreground">
                    <Link
                      to="/login"
                      className="underline hover:text-foreground"
                    >
                      Sign in
                    </Link>{" "}
                    or{" "}
                    <Link
                      to="/signup"
                      className="underline hover:text-foreground"
                    >
                      create an account
                    </Link>{" "}
                    to checkout
                  </p>
                )}

                <p className="mt-4 text-center font-body text-xs text-muted-foreground">
                  By placing your order, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
