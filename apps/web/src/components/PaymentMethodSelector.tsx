import { Banknote, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type PaymentMethod = "cod" | "upi";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  codAvailable?: boolean;
  total: number;
}

const paymentMethods = [
  {
    id: "upi" as const,
    name: "UPI",
    icon: Smartphone,
    description: "GPay, PhonePe, Paytm & more",
    badge: "Recommended",
  },
  {
    id: "cod" as const,
    name: "Cash on Delivery",
    icon: Banknote,
    description: "Pay when you receive",
    badge: null,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  codAvailable = true,
  total,
}: PaymentMethodSelectorProps) {
  const availableMethods = paymentMethods.filter(
    (method) => method.id !== "cod" || codAvailable
  );

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-medium">Payment Method</h3>

      <div className="space-y-3">
        {availableMethods.map((method) => (
          <button
            key={method.id}
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
                {method.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {method.badge}
                  </Badge>
                )}
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
        ))}
      </div>

      {selected === "upi" && (
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          You'll be redirected to Razorpay to complete your UPI payment securely.
        </p>
      )}

      {!codAvailable && (
        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          Cash on Delivery is not available for orders above ₹500
        </p>
      )}
    </div>
  );
}
