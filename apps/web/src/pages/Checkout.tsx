import { useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Tag, X, Check } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useValidateCoupon, useApplyCoupon, Coupon } from "@/hooks/useCoupons";
import { GiftWrapOption } from "@/components/GiftWrapOption";
import { SavedAddressSelector } from "@/components/SavedAddressSelector";
import { PaymentMethodSelector, PaymentMethod } from "@/components/PaymentMethodSelector";
import { useCreatePayment } from "@/hooks/usePayments";
import { useOrderTotal } from "@/hooks/useOrderTotal";
import { useRazorpay, RazorpayResponse } from "@/hooks/useRazorpay";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  
  const buyNowItem = location.state?.buyNowItem;
  
  // Use buyNowItem if present, otherwise use cartItems
  const checkoutItems = useMemo(() => {
    return buyNowItem ? [buyNowItem] : cartItems;
  }, [buyNowItem, cartItems]);

  const activeTotal = useMemo(() => {
    if (buyNowItem) {
      return buyNowItem.price * buyNowItem.quantity;
    }
    return cartTotal;
  }, [buyNowItem, cartTotal]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const validateCoupon = useValidateCoupon();
  const applyCouponMutation = useApplyCoupon();
  const createPayment = useCreatePayment();
  const { openCheckout, verifyPayment, isLoading: isRazorpayLoading } = useRazorpay();

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const codAvailable = activeTotal <= 500;

  // Gift wrap state
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const giftWrapPrice = 5;

  // Use OrderTotal domain object for pricing calculations
  const giftWrapCost = giftWrap ? giftWrapPrice : 0;
  const { shippingCost, tax, total } = useOrderTotal(activeTotal, couponDiscount, giftWrapCost);

  const handleGiftWrapChange = (enabled: boolean, message: string) => {
    setGiftWrap(enabled);
    setGiftMessage(message);
  };

  const handleAddressSelect = (address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    }));
  };
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildShippingAddress = () => ({
    full_name: `${formData.firstName} ${formData.lastName}`,
    firstName: formData.firstName,
    lastName: formData.lastName,
    address: formData.address,
    city: formData.city,
    postal_code: formData.postalCode,
    postalCode: formData.postalCode,
    country: formData.country,
    phone: formData.phone,
    email: formData.email,
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

  const finalizeOrder = async (transactionId?: string, gatewayPaymentMethod?: string) => {
    const order = await createOrder.mutateAsync({
      items: buildOrderItems(),
      subtotal: activeTotal,
      shippingCost,
      tax,
      total,
      shippingAddress: buildShippingAddress(),
    });

    if (order) {
      await createPayment.mutateAsync({
        orderId: order.id,
        amount: total,
        paymentMethod: gatewayPaymentMethod || paymentMethod,
        transactionId,
      });
    }

    if (!buyNowItem) {
      clearCart();
    }

    return order;
  };

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

    // UPI flow — Razorpay checkout
    openCheckout({
      amount: total,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      onSuccess: async (response: RazorpayResponse) => {
        try {
          const verified = await verifyPayment(response);
          if (!verified) {
            toast.error("Payment verification failed", {
              description: "Please contact support if amount was deducted.",
            });
            setIsSubmitting(false);
            return;
          }

          await finalizeOrder(response.razorpay_payment_id, "upi");
          toast.success("Payment successful! Order placed.", {
            description: `Transaction ID: ${response.razorpay_payment_id}`,
          });
          navigate("/orders");
        } catch (error) {
          toast.error("Failed to save order after payment", {
            description: "Payment was successful. Please contact support with your transaction ID.",
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
          <h1 className="mb-4 font-display text-4xl font-medium">Your Cart is Empty</h1>
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
      <div className="container mx-auto px-6 py-6 md:py-8">
        <Link 
          to="/cart" 
          className="mb-8 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="mb-12 font-display text-4xl font-medium md:text-5xl">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div>
                <h2 className="mb-6 font-display text-xl font-medium">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="mb-6 font-display text-xl font-medium">Shipping Address</h2>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
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
                  <p className="font-body text-xs text-muted-foreground">Free Shipping ₹100+</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">Secure Checkout</p>
                </div>
                <div className="text-center">
                  <CreditCard className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">Safe Payment</p>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div className="sticky top-8 bg-muted p-6">
                <h2 className="mb-6 font-display text-xl font-medium">Order Summary</h2>

                {/* Cart Items */}
                <div className="mb-6 space-y-4 border-b border-border pb-6">
                  {checkoutItems.map((item) => (
                    <div key={`${item.id}-${item.ownerSize}-${item.petSize}`} className="flex gap-4">
                      <div className="h-20 w-16 flex-shrink-0 overflow-hidden bg-background">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-body text-sm font-medium">{item.name}</h3>
                        <p className="font-body text-xs text-muted-foreground">
                          Size: {item.ownerSize} / Pet: {item.petSize}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm font-medium">₹{item.price * item.quantity}</p>
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
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
                    <span>{shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-6">
                  <span className="font-display text-lg font-medium">Total</span>
                  <span className="font-display text-lg font-medium">₹{total.toFixed(2)}</span>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full" 
                  disabled={isSubmitting || !user}
                >
                  {isSubmitting || isRazorpayLoading ? "Processing..." : user ? "Place Order" : "Sign in to Checkout"}
                </Button>

                {!user && (
                  <p className="mt-4 text-center font-body text-xs text-muted-foreground">
                    <Link to="/login" className="underline hover:text-foreground">Sign in</Link> or{" "}
                    <Link to="/signup" className="underline hover:text-foreground">create an account</Link> to checkout
                  </p>
                )}

                <p className="mt-4 text-center font-body text-xs text-muted-foreground">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
