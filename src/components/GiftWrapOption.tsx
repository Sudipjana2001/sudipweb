import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";

interface GiftWrapOptionProps {
  onGiftWrapChange: (enabled: boolean, message: string) => void;
  giftWrapPrice?: number;
}

export function GiftWrapOption({ onGiftWrapChange, giftWrapPrice = 5 }: GiftWrapOptionProps) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    onGiftWrapChange(checked, message);
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    onGiftWrapChange(enabled, value);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="gift-wrap"
          checked={enabled}
          onCheckedChange={(checked) => handleEnabledChange(checked as boolean)}
        />
        <div className="flex-1 space-y-2">
          <Label
            htmlFor="gift-wrap"
            className="flex cursor-pointer items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Add Gift Wrapping
            </span>
            <span className="text-sm text-muted-foreground">+${giftWrapPrice.toFixed(2)}</span>
          </Label>
          
          {enabled && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="gift-message" className="text-sm text-muted-foreground">
                Gift Message (optional)
              </Label>
              <Textarea
                id="gift-message"
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Write a personal message..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/200 characters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
