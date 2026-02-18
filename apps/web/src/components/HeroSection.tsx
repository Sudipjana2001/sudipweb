import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useHeroSlides } from "@/hooks/useHeroSlides";

// Fallback slides if database is empty or loading fails
const fallbackSlides = [
  {
    id: 1,
    image_url: "/hero-1.jpg",
    headline: "Where Pets & Style Twin",
    subheadline: "Premium comfort meets perfect design. Matching outfits for you and your best friend.",
    cta1_text: "Shop Pebric Sets",
    cta1_link: "/shop?collection=pebric",
    cta2_text: "Explore Collections",
    cta2_link: "/shop",
  },
  {
    id: 2,
    image_url: "/hero-2.jpg",
    headline: "Summer Collection 2024",
    subheadline: "Breathable fabrics, effortless style. Stay cool together this season.",
    cta1_text: "Shop Summer",
    cta1_link: "/summer",
    cta2_text: "View Lookbook",
    cta2_link: "/shop",
  },
  {
    id: 3,
    image_url: "/hero-3.jpg",
    headline: "Cozy Winter Essentials",
    subheadline: "Warmth never looked this good. Luxurious layers for cold days.",
    cta1_text: "Shop Winter",
    cta1_link: "/winter",
    cta2_text: "Explore Styles",
    cta2_link: "/shop",
  },
];

export function HeroSection() {
  const { data: dbSlides, isLoading } = useHeroSlides();
  const navigate = useNavigate();
  
  // Use database slides if available, otherwise use fallback
  // Use database slides if available, otherwise use fallback
  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : fallbackSlides;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-muted">
      {/* Embla Carousel Viewport */}
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full w-full touch-pan-y">
          {slides.map((slide) => (
            <div key={slide.id} className="relative h-full min-w-full flex-[0_0_100%]">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${slide.image_url})`,
                  filter: "brightness(0.9)",
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-foreground/10" />

              {/* Content */}
              <div className="relative z-20 flex h-full items-center justify-center">
                <div className="container mx-auto px-6 text-center">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-foreground/70">
                      Premium Pet Fashion
                    </p>
                    <h1 className="mb-6 font-display text-5xl font-medium leading-tight tracking-tight text-foreground md:text-7xl lg:text-8xl">
                      {slide.headline}
                    </h1>
                    <p className="mx-auto mb-10 max-w-xl font-body text-lg text-foreground/80 md:text-xl">
                      {slide.subheadline}
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <Button 
                        variant="hero" 
                        size="xl"
                        onClick={() => navigate(slide.cta1_link || "/shop")}
                      >
                        {slide.cta1_text || "Shop Now"}
                      </Button>
                      <Button 
                        variant="hero-outline" 
                        size="xl"
                        onClick={() => navigate(slide.cta2_link || "/shop")}
                      >
                        {slide.cta2_text || "Explore"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-6 top-1/2 z-30 -translate-y-1/2 p-3 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-110 active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-6 top-1/2 z-30 -translate-y-1/2 p-3 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-110 active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight className="h-8 w-8" />
      </button>


    </section>
  );
}
