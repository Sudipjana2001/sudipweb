import { useRef, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNewsletterConfig } from "@/hooks/useNewsletterConfig";

export function Newsletter() {
  const { ref, isVisible } = useScrollAnimation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: config, isLoading } = useNewsletterConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success("Welcome to the family! Check your inbox for your 10% off code.");
      setEmail("");
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  // If loading, show nothing or skeleton (optional)
  if (isLoading) return null;

  // Ideally config should exist, but handle if somehow missing
  const badgeText = config?.badge_text || "Join the Family";
  const headline = config?.headline || "Unlock 10% Off Your First Order";
  const description = config?.description || "Plus get early access to new collections, exclusive offers, and adorable pet content.";

  if (config && !config.is_active) return null;

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center shadow-elevated md:px-16 md:py-24 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Decorative Elements */}
          <Sparkles className="absolute left-8 top-8 h-8 w-8 text-background/20 animate-pulse md:h-12 md:w-12" />
          <Sparkles className="absolute bottom-8 right-8 h-6 w-6 text-background/20 animate-pulse md:h-10 md:w-10" style={{ animationDelay: "1s" }} />
          
          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="mb-6 inline-block rounded-full bg-background/10 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.2em] text-background backdrop-blur-sm">
              {badgeText}
            </span>
            
            <h2 className="mb-6 font-display text-3xl font-medium tracking-tight text-background md:text-5xl">
              {headline}
            </h2>
            
            <p className="mb-10 font-body text-lg text-background/80 md:text-xl">
              {description}
            </p>
            
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-4 md:flex-row">
              <Input
                type="email"
                placeholder="Details needed from your pet..."
                className="h-12 border-background/20 bg-background/10 text-background placeholder:text-background/50 focus-visible:ring-background/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                variant="secondary"
                size="lg"
                className="h-12 px-8 font-medium transition-all hover:scale-105 active:scale-95"
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : isSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Joined!
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="mt-6 text-xs text-background/40">
              By subscribing, you agree to receive marketing communications. 
              We respect your privacy and your pet's nap time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
