import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Upload } from "lucide-react";
import { usePets } from "@/hooks/usePets";

interface TryOnPreviewProps {
  productImage: string;
  productName: string;
}

export function TryOnPreview({ productImage, productName }: TryOnPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: pets } = usePets();
  const primaryPet = pets?.find((p) => p.is_primary) || pets?.[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Virtual Try-On
          <Badge variant="secondary" className="ml-auto">
            Coming Soon
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Product overlay */}
          <img
            src={productImage}
            alt={productName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* AR Preview placeholder overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent flex flex-col items-center justify-end p-4 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">AR Try-On Preview</p>
                <p className="text-sm text-muted-foreground">
                  See how this looks on {primaryPet?.name || "your pet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Button className="w-full" variant="outline" disabled>
            <Camera className="mr-2 h-4 w-4" />
            Try On with Camera
          </Button>
          <Button className="w-full" variant="ghost" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Pet Photo
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            AR try-on feature launching soon! Upload your pet's photo to see how
            outfits will look.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
