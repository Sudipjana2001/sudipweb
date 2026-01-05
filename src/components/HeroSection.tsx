import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    image: "/hero-1.jpg",
    headline: "Where Pets & Style Twin",
    subheadline: "Premium comfort meets perfect design. Matching outfits for you and your best friend.",
    cta1: "Shop Twinning Sets",
    cta1Link: "/shop?collection=twinning",
    cta2: "Explore Collections",
    cta2Link: "/shop",
  },
  {
    id: 2,
    image: "/hero-2.jpg",
    headline: "Summer Collection 2024",
    subheadline: "Breathable fabrics, effortless style. Stay cool together this season.",
    cta1: "Shop Summer",
    cta1Link: "/summer",
    cta2: "View Lookbook",
    cta2Link: "/shop",
  },
  {
    id: 3,
    image: "/hero-3.jpg",
    headline: "Cozy Winter Essentials",
    subheadline: "Warmth never looked this good. Luxurious layers for cold days.",
    cta1: "Shop Winter",
    cta1Link: "/winter",
    cta2: "Explore Styles",
    cta2Link: "/shop",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const parallaxOffset = scrollY * 0.4;

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-muted">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image with Parallax */}
          <div 
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{ 
              backgroundImage: `url(${slide.image})`,
              filter: "brightness(0.9)",
              transform: `translateY(${parallaxOffset}px) scale(1.1)`,
              height: "120%",
              top: "-10%"
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-foreground/10" />

          {/* Content */}
          <div className="relative z-20 flex h-full items-center justify-center">
            <div className="container mx-auto px-6 text-center">
              <div
                className={`transition-all duration-700 ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
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
                    onClick={() => navigate(slide.cta1Link)}
                  >
                    {slide.cta1}
                  </Button>
                  <Button 
                    variant="hero-outline" 
                    size="xl"
                    onClick={() => navigate(slide.cta2Link)}
                  >
                    {slide.cta2}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 z-30 -translate-y-1/2 p-3 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-110 active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 z-30 -translate-y-1/2 p-3 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-110 active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 z-30 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-0.5 transition-all duration-300 ${
              index === currentSlide
                ? "w-12 bg-foreground"
                : "w-6 bg-foreground/30 hover:bg-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-foreground/50 to-transparent animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>
    </section>
  );
}
