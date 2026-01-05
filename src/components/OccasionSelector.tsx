import { useOccasions } from "@/hooks/useOccasions";
import { useNavigate } from "react-router-dom";

export function OccasionSelector() {
  const { data: occasions = [], isLoading } = useOccasions();
  const navigate = useNavigate();

  if (isLoading || occasions.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Shop By
          </p>
          <h2 className="font-display text-3xl font-medium">Occasion</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => navigate(`/shop?occasion=${occasion.id}`)}
              className="group flex items-center gap-2 px-5 py-3 border border-border bg-background rounded-full transition-all hover:border-foreground hover:shadow-md"
            >
              <span className="text-xl">{occasion.icon}</span>
              <span className="font-medium">{occasion.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
