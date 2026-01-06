import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { ref, isVisible } = useScrollAnimation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      toast.success("Welcome to the Twinning Club!", {
        description: "Check your inbox for exclusive offers.",
      });
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section className="bg-muted py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Header */}
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Stay Connected
          </p>
          <h2 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Join the Twinning Club
          </h2>
          <p className="mb-10 font-body text-lg text-muted-foreground">
            Be the first to know about new collections, exclusive offers, and pet fashion tips.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 border-border bg-background px-6 font-body text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-0 transition-all duration-300 focus:shadow-soft"
                required
              />
            </div>
            <Button 
              type="submit" 
              variant="hero"
              disabled={isSubmitted}
              className="h-14 min-w-[180px]"
            >
              {isSubmitted ? (
                <>
                  <Check className="h-4 w-4 animate-scale-in" />
                  Subscribed
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Privacy Note */}
          <p className="mt-6 font-body text-xs text-muted-foreground">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
