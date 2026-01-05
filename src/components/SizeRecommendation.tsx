import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePets, Pet } from "@/hooks/usePets";
import { useBreedSizingRules, getSmartSizeRecommendation } from "@/hooks/useBreedSizing";
import { useAuth } from "@/contexts/AuthContext";
import { Ruler, Check, AlertCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface SizeRecommendationProps {
  onSizeSelect: (size: string) => void;
  availableSizes: string[];
}

export function SizeRecommendation({ onSizeSelect, availableSizes }: SizeRecommendationProps) {
  const { user } = useAuth();
  const { data: pets = [] } = usePets();
  const { data: breedRules = [] } = useBreedSizingRules();
  
  const [open, setOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const recommendation = selectedPet 
    ? getSmartSizeRecommendation(selectedPet, breedRules)
    : null;

  const handleApplySize = () => {
    if (recommendation && availableSizes.includes(recommendation.size)) {
      onSizeSelect(recommendation.size);
      setOpen(false);
    }
  };

  if (!user) {
    return (
      <Link to="/login" className="text-sm text-primary underline">
        Sign in for personalized size recommendations
      </Link>
    );
  }

  if (pets.length === 0) {
    return (
      <Link to="/pets" className="flex items-center gap-2 text-sm text-primary underline">
        <Ruler className="h-4 w-4" />
        Add your pet for size recommendations
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm">
          <Ruler className="mr-1 h-4 w-4" />
          Get size recommendation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Size Recommendation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedPetId} onValueChange={setSelectedPetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select your pet" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species}{pet.breed ? ` - ${pet.breed}` : ""})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPet && recommendation ? (
            <div className={`rounded-lg p-4 ${
              recommendation.confidence === "high" 
                ? "bg-green-50 dark:bg-green-900/20" 
                : recommendation.confidence === "medium"
                ? "bg-yellow-50 dark:bg-yellow-900/20"
                : "bg-muted"
            }`}>
              <div className="flex items-start gap-3">
                {recommendation.confidence === "high" ? (
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                ) : recommendation.confidence === "medium" ? (
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    Recommended size: <span className="text-lg">{recommendation.size}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {recommendation.reason}
                  </p>
                  {recommendation.confidence === "low" && (
                    <Link 
                      to="/pets" 
                      className="inline-block mt-2 text-sm text-primary underline"
                    >
                      Add measurements for better accuracy
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : selectedPet ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                We need more information to recommend a size.
              </p>
              <Link 
                to="/pets" 
                className="inline-block mt-2 text-sm text-primary underline"
              >
                Add pet measurements
              </Link>
            </div>
          ) : null}

          {recommendation && availableSizes.includes(recommendation.size) && (
            <Button onClick={handleApplySize} className="w-full">
              Select Size {recommendation.size}
            </Button>
          )}

          {recommendation && !availableSizes.includes(recommendation.size) && (
            <p className="text-sm text-destructive text-center">
              Unfortunately, size {recommendation.size} is not available for this product.
            </p>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              For the best fit, we recommend measuring your pet's chest circumference
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
