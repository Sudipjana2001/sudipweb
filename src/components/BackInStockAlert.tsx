import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCreateBackInStockAlert, useIsAlertSet } from "@/hooks/useBackInStock";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, BellOff, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface BackInStockAlertProps {
  productId: string;
  size?: string;
  variant?: "button" | "inline";
}

export function BackInStockAlert({ productId, size, variant = "button" }: BackInStockAlertProps) {
  const { user } = useAuth();
  const { data: isAlertSet } = useIsAlertSet(productId, size);
  const createAlert = useCreateBackInStockAlert();
  
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlert.mutateAsync({
      productId,
      email,
      size,
    });
    setOpen(false);
  };

  if (isAlertSet) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>We'll notify you when back in stock</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link to="/login" className="text-sm text-primary underline">
        Sign in to get notified when back in stock
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={createAlert.isPending}>
          <Bell className="mr-1 h-4 w-4" />
          Notify Me
        </Button>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Bell className="mr-2 h-4 w-4" />
          Notify When Available
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Get Notified</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We'll email you when this item is back in stock.
          </p>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
          <Button type="submit" className="w-full" disabled={createAlert.isPending}>
            {createAlert.isPending ? "Subscribing..." : "Notify Me"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
