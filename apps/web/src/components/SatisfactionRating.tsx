import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Send, Loader2 } from "lucide-react";
import { useCreateSatisfactionRating } from "@/hooks/useSatisfactionRatings";

interface SatisfactionRatingProps {
  orderId?: string;
  ticketId?: string;
  ratingType: "order" | "support" | "product" | "delivery";
  onComplete?: () => void;
}

export function SatisfactionRating({ orderId, ticketId, ratingType, onComplete }: SatisfactionRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const createRating = useCreateSatisfactionRating();

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    await createRating.mutateAsync({
      order_id: orderId,
      ticket_id: ticketId,
      rating,
      feedback: feedback || undefined,
      rating_type: ratingType,
    });
    
    setSubmitted(true);
    onComplete?.();
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold">Thank You!</h3>
          <p className="text-muted-foreground">Your feedback helps us improve.</p>
        </CardContent>
      </Card>
    );
  }

  const titles = {
    order: "How was your order experience?",
    support: "How was our support?",
    product: "How satisfied are you with the product?",
    delivery: "How was the delivery experience?",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titles[ratingType]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent!"}
          </div>
        )}

        <Textarea
          placeholder="Tell us more about your experience (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || createRating.isPending}
          className="w-full"
        >
          {createRating.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
