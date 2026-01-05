import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
  size?: string | null;
  pet_size?: string | null;
}

interface ReorderButtonProps {
  orderItems: OrderItem[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ReorderButton({ orderItems, variant = "outline", size = "sm" }: ReorderButtonProps) {
  const [isReordering, setIsReordering] = useState(false);
  const addToCart = useAddToCart();
  const navigate = useNavigate();

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      let addedCount = 0;
      
      for (const item of orderItems) {
        if (item.product_id) {
          await addToCart.mutateAsync({
            productId: item.product_id,
            quantity: item.quantity,
            size: item.size || undefined,
            petSize: item.pet_size || undefined,
          });
          addedCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`${addedCount} item(s) added to cart`, {
          action: {
            label: "View Cart",
            onClick: () => navigate("/cart"),
          },
        });
      } else {
        toast.error("Some items are no longer available");
      }
    } catch (error) {
      toast.error("Failed to reorder items");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleReorder} disabled={isReordering}>
      {isReordering ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      Reorder
    </Button>
  );
}
