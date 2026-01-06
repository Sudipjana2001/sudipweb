import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTestimonials } from "@/hooks/useTestimonials";

const DEFAULT_TESTIMONIALS = [
  {
    id: "1",
    customer_name: "Sarah Mitchell",
    location: "New York, NY",
    rating: 5,
    review_text: "Finally found a brand that understands the bond between me and my golden retriever. The quality is exceptional, and we get so many compliments when we go out!",
    pet_name: "Max",
    image_url: "/testimonial-1.jpg",
  },
  {
    id: "2",
    customer_name: "James Chen",
    location: "San Francisco, CA",
    rating: 5,
    review_text: "The attention to detail is incredible. My French bulldog loves wearing his matching outfits, and the fabric is so soft. Worth every penny.",
    pet_name: "Bruno",
    image_url: "/testimonial-2.jpg",
  },
  {
    id: "3",
    customer_name: "Emma Rodriguez",
    location: "Austin, TX",
    rating: 5,
    review_text: "I was skeptical at first, but these are genuinely the most comfortable pet clothes we've tried. Luna actually gets excited when she sees her matching hoodie!",
    pet_name: "Luna",
    image_url: "/testimonial-3.jpg",
  },
  {
    id: "4",
    customer_name: "Michael Park",
    location: "Seattle, WA",
    rating: 5,
    review_text: "The winter collection saved our daily walks. Both my pup and I stay warm and stylish. The customer service team was also incredibly helpful with sizing.",
    pet_name: "Coco",
    image_url: "/testimonial-4.jpg",
  },
];

export function Testimonials() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.1 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: dbTestimonials, isLoading } = useTestimonials();
  
  // Use database testimonials if available, otherwise fallback
  const testimonials = (dbTestimonials && dbTestimonials.length > 0) ? dbTestimonials : DEFAULT_TESTIMONIALS;

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="bg-secondary/30 py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">
          
          {/* Header & Controls */}
          <div 
            ref={headerRef}
            className={`mb-12 lg:mb-0 lg:w-1/3 transition-all duration-700 ${
              headerVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Community Love
            </p>
            <h2 className="mb-8 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Stories from our <br />
              <span className="italic text-primary">Happy Families</span>
            </h2>
            
            <div className="hidden lg:flex lg:gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-border hover:bg-background hover:text-foreground"
                onClick={prevTestimonial}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-border hover:bg-background hover:text-foreground"
                onClick={nextTestimonial}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Testimonials Card */}
          <div 
            ref={contentRef}
            className={`relative lg:w-2/3 transition-all duration-700 ${
              contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="relative overflow-hidden rounded-2xl bg-background p-8 md:p-12 shadow-sm">
              <div className="mb-8 flex gap-1">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              <blockquote className="mb-10 font-display text-2xl leading-relaxed text-foreground md:text-3xl">
                "{currentTestimonial.review_text}"
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-secondary">
                   {currentTestimonial.image_url ? (
                    <img
                      src={currentTestimonial.image_url}
                      alt={currentTestimonial.customer_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-display text-lg font-medium text-foreground">
                    {currentTestimonial.customer_name}
                  </div>
                  <div className="font-body text-sm text-muted-foreground">
                    {currentTestimonial.location} • {currentTestimonial.pet_name}'s Human
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="mt-8 flex justify-center gap-4 lg:hidden">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-border hover:bg-background hover:text-foreground"
                onClick={prevTestimonial}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-border hover:bg-background hover:text-foreground"
                onClick={nextTestimonial}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
