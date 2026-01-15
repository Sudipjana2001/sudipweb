import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSubmitFitFeedback, FitRating } from "@/hooks/useFitFeedback";
import { usePets } from "@/hooks/usePets";
import { Ruler } from "lucide-react";

interface FitFeedbackFormProps {
  productId: string;
  orderItemId?: string;
  sizePurchased?: string;
}

const fitOptions: { value: FitRating; label: string; emoji: string }[] = [
  { value: "too_tight", label: "Too Tight", emoji: "😣" },
  { value: "slightly_tight", label: "Slightly Tight", emoji: "😐" },
  { value: "perfect", label: "Perfect Fit", emoji: "😊" },
  { value: "slightly_loose", label: "Slightly Loose", emoji: "😐" },
  { value: "too_loose", label: "Too Loose", emoji: "😕" },
];

export function FitFeedbackForm({ productId, orderItemId, sizePurchased }: FitFeedbackFormProps) {
  const { data: pets = [] } = usePets();
  const submitFeedback = useSubmitFitFeedback();
  
  const [open, setOpen] = useState(false);
  const [fitRating, setFitRating] = useState<FitRating | "">("");
  const [petId, setPetId] = useState("");
  const [wouldRecommendSize, setWouldRecommendSize] = useState("");
  const [comments, setComments] = useState("");

  const handleSubmit = async () => {
    if (!fitRating) return;
    
    await submitFeedback.mutateAsync({
      productId,
      orderItemId,
      petId: petId || undefined,
      fitRating,
      sizePurchased,
      wouldRecommendSize: wouldRecommendSize || undefined,
      comments: comments || undefined,
    });
    
    setOpen(false);
    setFitRating("");
    setPetId("");
    setWouldRecommendSize("");
    setComments("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Ruler className="mr-2 h-4 w-4" />
          How Did It Fit?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fit Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {sizePurchased && (
            <p className="text-sm text-muted-foreground">
              You purchased size: <strong>{sizePurchased}</strong>
            </p>
          )}

          <div className="space-y-3">
            <Label>How did it fit?</Label>
            <RadioGroup
              value={fitRating}
              onValueChange={(v) => setFitRating(v as FitRating)}
              className="grid grid-cols-5 gap-2"
            >
              {fitOptions.map((option) => (
                <div key={option.value} className="flex flex-col items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-colors ${
                      fitRating === option.value
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="block text-xs mt-1">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {pets.length > 0 && (
            <div className="space-y-2">
              <Label>Which pet was this for?</Label>
              <Select value={petId} onValueChange={setPetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pet (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>What size would you recommend?</Label>
            <Select value={wouldRecommendSize} onValueChange={setWouldRecommendSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select size (optional)" />
              </SelectTrigger>
              <SelectContent>
                {["XS", "S", "M", "L", "XL"].map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any other feedback about the fit?"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!fitRating || submitFeedback.isPending}
            className="w-full"
          >
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
