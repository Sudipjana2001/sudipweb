import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "New York, NY",
    rating: 5,
    text: "Finally found a brand that understands the bond between me and my golden retriever. The quality is exceptional, and we get so many compliments when we go out!",
    petName: "Max",
    image: "/testimonial-1.jpg",
  },
  {
    id: 2,
    name: "James Chen",
    location: "San Francisco, CA",
    rating: 5,
    text: "The attention to detail is incredible. My French bulldog loves wearing his matching outfits, and the fabric is so soft. Worth every penny.",
    petName: "Bruno",
    image: "/testimonial-2.jpg",
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    location: "Austin, TX",
    rating: 5,
    text: "I was skeptical at first, but these are genuinely the most comfortable pet clothes we've tried. Luna actually gets excited when she sees her matching hoodie!",
    petName: "Luna",
    image: "/testimonial-3.jpg",
  },
  {
    id: 4,
    name: "Michael Park",
    location: "Seattle, WA",
    rating: 5,
    text: "The winter collection saved our daily walks. Both my pup and I stay warm and stylish. The customer service team was also incredibly helpful with sizing.",
    petName: "Coco",
    image: "/testimonial-4.jpg",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({ threshold: 0.2 });

  const changeTestimonial = (newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const nextTestimonial = () => {
    changeTestimonial((currentIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    changeTestimonial((currentIndex - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="bg-secondary py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`mb-16 text-center transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Happy Families
          </p>
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonial Card */}
        <div 
          ref={cardRef}
          className={`mx-auto max-w-4xl transition-all duration-700 ${
            cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="relative bg-background p-8 shadow-soft md:p-12 transition-shadow duration-500 hover:shadow-elevated">
            {/* Quote Icon */}
            <Quote className="absolute right-8 top-8 h-12 w-12 text-muted/50 md:h-16 md:w-16 transition-transform duration-700 hover:scale-110 hover:rotate-12" />

            <div 
              className={`flex flex-col items-center gap-8 md:flex-row md:items-start transition-all duration-500 ${
                isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
              }`}
            >
              {/* Image */}
              <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-muted md:h-40 md:w-40 transition-transform duration-500 hover:scale-105">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-110"
                  style={{ backgroundImage: `url(${current.image})` }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                {/* Stars */}
                <div className="mb-4 flex justify-center gap-1 md:justify-start">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4 fill-foreground text-foreground transition-all duration-300 hover:scale-125"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 font-body text-lg leading-relaxed text-foreground md:text-xl">
                  "{current.text}"
                </p>

                {/* Author */}
                <div>
                  <p className="font-display text-lg font-medium text-foreground">
                    {current.name}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {current.location} · Pet: {current.petName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prevTestimonial}
              className="flex h-12 w-12 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105 active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => changeTestimonial(index)}
                  className={`h-2 transition-all duration-500 hover:bg-foreground/70 ${
                    index === currentIndex
                      ? "w-8 bg-foreground"
                      : "w-2 bg-foreground/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="flex h-12 w-12 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105 active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
