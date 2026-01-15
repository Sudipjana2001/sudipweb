import { Droplets, Wind, Sparkles, Shirt, ThermometerSun, Leaf } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductFabricInfoProps {
  fabricType?: string | null;
  breathability?: number | null;
  stretchLevel?: number | null;
  isAllergySafe?: boolean | null;
  careWash?: string | null;
  careDry?: string | null;
  durabilityRating?: number | null;
  seasonalTags?: string[] | null;
}

function RatingDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < value ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductFabricInfo({
  fabricType,
  breathability,
  stretchLevel,
  isAllergySafe,
  careWash,
  careDry,
  durabilityRating,
  seasonalTags,
}: ProductFabricInfoProps) {
  const hasAnyData = fabricType || breathability || stretchLevel || isAllergySafe || 
                     careWash || careDry || durabilityRating || (seasonalTags && seasonalTags.length > 0);

  if (!hasAnyData) return null;

  return (
    <div className="border-t border-border pt-6 space-y-6">
      <h3 className="font-display text-lg font-medium">Fabric & Care</h3>
      
      {/* Fabric Type */}
      {fabricType && (
        <div className="flex items-center gap-3">
          <Shirt className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Material</p>
            <p className="text-sm text-muted-foreground">{fabricType}</p>
          </div>
        </div>
      )}

      {/* Comfort Indicators */}
      <div className="grid grid-cols-2 gap-4">
        {breathability && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <Wind className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Breathability</p>
                  <RatingDots value={breathability} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>How well air flows through the fabric</p>
            </TooltipContent>
          </Tooltip>
        )}

        {stretchLevel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Stretch</p>
                  <RatingDots value={stretchLevel} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Flexibility and comfort during movement</p>
            </TooltipContent>
          </Tooltip>
        )}

        {durabilityRating && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Durability</p>
                  <RatingDots value={durabilityRating} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Long-lasting quality rating</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isAllergySafe && (
          <div className="flex items-center gap-3">
            <Leaf className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Allergy Safe</p>
              <p className="text-xs text-muted-foreground">Hypoallergenic</p>
            </div>
          </div>
        )}
      </div>

      {/* Care Instructions */}
      {(careWash || careDry) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Care Instructions</p>
          <div className="flex flex-wrap gap-2">
            {careWash && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                <Droplets className="h-3 w-3" />
                {careWash}
              </span>
            )}
            {careDry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                <ThermometerSun className="h-3 w-3" />
                {careDry}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Seasonal Tags */}
      {seasonalTags && seasonalTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Best For</p>
          <div className="flex flex-wrap gap-2">
            {seasonalTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
