import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

interface MatchingOutfitsProps {
  productId: string;
  matchingProductId?: string | null;
}

export function MatchingOutfits({ productId, matchingProductId }: MatchingOutfitsProps) {
  const { data: matchingProduct } = useQuery({
    queryKey: ["matching-product", matchingProductId],
    queryFn: async () => {
      if (!matchingProductId) return null;
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", matchingProductId)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!matchingProductId,
  });

  if (!matchingProduct) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Match with Your Pet!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Matching owner outfits coming soon!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Twin with your furry friend in style
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          Twin with Your Pet!
          <Badge className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500">
            Matching Set
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link to={`/product/${matchingProduct.slug}`} className="block group">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {matchingProduct.image_url && (
              <img
                src={matchingProduct.image_url}
                alt={matchingProduct.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-semibold text-lg">{matchingProduct.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-primary">
                  ₹{matchingProduct.price}
                </span>
                {matchingProduct.original_price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{matchingProduct.original_price}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        <Button asChild className="w-full mt-4">
          <Link to={`/product/${matchingProduct.slug}`}>
            View Matching Outfit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Get 15% off when you buy the matching set!
        </p>
      </CardContent>
    </Card>
  );
}
