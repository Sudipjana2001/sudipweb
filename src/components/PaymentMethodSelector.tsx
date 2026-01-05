import { useState } from "react";
import { CreditCard, Wallet, Banknote, Smartphone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type PaymentMethod = "cod" | "card" | "upi" | "wallet" | "netbanking";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  codAvailable?: boolean;
  total: number;
}

const paymentMethods = [
  {
    id: "cod" as const,
    name: "Cash on Delivery",
    icon: Banknote,
    description: "Pay when you receive",
    fee: 0,
  },
  {
    id: "card" as const,
    name: "Credit/Debit Card",
    icon: CreditCard,
    description: "Visa, Mastercard, Amex",
    fee: 0,
  },
  {
    id: "upi" as const,
    name: "UPI",
    icon: Smartphone,
    description: "GPay, PhonePe, Paytm",
    fee: 0,
  },
  {
    id: "wallet" as const,
    name: "Wallet",
    icon: Wallet,
    description: "Paytm, Mobikwik, etc.",
    fee: 0,
  },
  {
    id: "netbanking" as const,
    name: "Net Banking",
    icon: Building2,
    description: "All major banks",
    fee: 0,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  codAvailable = true,
  total,
}: PaymentMethodSelectorProps) {
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [upiId, setUpiId] = useState("");

  const availableMethods = paymentMethods.filter(
    (method) => method.id !== "cod" || codAvailable
  );

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-medium">Payment Method</h3>
      
      <div className="space-y-3">
        {availableMethods.map((method) => (
          <div key={method.id}>
            <button
              type="button"
              onClick={() => onSelect(method.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                selected === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selected === method.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <method.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.name}</span>
                  {method.id === "cod" && (
                    <Badge variant="secondary" className="text-xs">
                      No extra charge
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  selected === method.id
                    ? "border-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selected === method.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>

            {/* Card Details Form */}
            {selected === "card" && method.id === "card" && (
              <div className="mt-3 p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, number: e.target.value })
                    }
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, expiry: e.target.value })
                      }
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value })
                      }
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, name: e.target.value })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment will be processed securely via Stripe
                </p>
              </div>
            )}

            {/* UPI Form */}
            {selected === "upi" && method.id === "upi" && (
              <div className="mt-3 p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID to receive payment request
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!codAvailable && (
        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          Cash on Delivery is not available for orders above $500
        </p>
      )}
    </div>
  );
}
