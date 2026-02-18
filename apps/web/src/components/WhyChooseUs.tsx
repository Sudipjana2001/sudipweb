import { 
  Sparkles, Heart, RefreshCw, Truck, Shield, Star, 
  Award, Check, Gift, Zap, Target, TrendingUp 
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useFeatures } from "@/hooks/useFeatures";

const ICON_MAP: Record<string, any> = {
  Sparkles, Heart, RefreshCw, Truck, Shield, Star,
  Award, Check, Gift, Zap, Target, TrendingUp
};

const DEFAULT_FEATURES = [
  {
    icon_name: "Sparkles",
    title: "Premium Fabrics",
    description: "Carefully selected materials for maximum comfort and durability for both you and your pet.",
  },
  {
    icon_name: "Heart",
    title: "Pet-First Design",
    description: "Every piece is designed with your pet's comfort and freedom of movement in mind.",
  },
  {
    icon_name: "RefreshCw",
    title: "Perfect Pebric Fit",
    description: "Our sizing system ensures you and your pet match perfectly, every single time.",
  },
  {
    icon_name: "Truck",
    title: "Easy Returns",
    description: "30-day hassle-free returns. If it doesn't fit, we'll make it right.",
  },
];

export function WhyChooseUs() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });
  const { data: dbFeatures, isLoading } = useFeatures();

  // Use database features if available, otherwise fallback
  const features = DEFAULT_FEATURES;

  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`mb-16 text-center transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            The Difference
          </p>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Why Pet Parents Choose Us
          </h2>
        </div>

        {/* Features Grid */}
        <div ref={gridRef} className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const IconComponent = ICON_MAP[feature.icon_name] || Sparkles;
            
            return (
              <div
                key={feature.title}
                className={`group text-center transition-all duration-700 ${
                  gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-border transition-all duration-500 group-hover:border-foreground group-hover:bg-foreground group-hover:scale-110 group-hover:rotate-3">
                  <IconComponent className="h-6 w-6 text-foreground transition-all duration-500 group-hover:text-background group-hover:scale-110" />
                </div>

                {/* Content */}
                <h3 className="mb-3 font-display text-xl font-medium text-foreground transition-transform duration-300 group-hover:-translate-y-1">
                  {feature.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-foreground/70">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
