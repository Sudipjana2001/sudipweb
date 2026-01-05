import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function PromoBanner() {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation();
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-foreground py-16 md:py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`flex flex-col items-center text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Badge */}
          <span className="mb-6 inline-block border border-background/30 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.3em] text-background/70 animate-pulse">
            Limited Time Offer
          </span>

          {/* Headline */}
          <h2 className="mb-4 font-display text-4xl font-medium tracking-tight text-background md:text-6xl">
            Flat 20% Off
          </h2>
          <p className="mb-10 font-display text-xl text-background/80 md:text-2xl">
            On All Twinning Sets
          </p>

          {/* Countdown Timer */}
          <div className="mb-10 flex gap-4 md:gap-8">
            <TimeUnit value={timeLeft.days} label="Days" index={0} isVisible={isVisible} />
            <TimeUnit value={timeLeft.hours} label="Hours" index={1} isVisible={isVisible} />
            <TimeUnit value={timeLeft.minutes} label="Minutes" index={2} isVisible={isVisible} />
            <TimeUnit value={timeLeft.seconds} label="Seconds" index={3} isVisible={isVisible} />
          </div>

          {/* CTA */}
          <Button 
            variant="hero-outline" 
            className="border-background text-background hover:bg-background hover:text-foreground"
            onClick={() => navigate("/shop?collection=twinning")}
          >
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label, index, isVisible }: { value: number; label: string; index: number; isVisible: boolean }) {
  return (
    <div 
      className={`flex flex-col items-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100 + 200}ms` }}
    >
      <div className="mb-2 flex h-16 w-16 items-center justify-center bg-background/10 md:h-20 md:w-20 transition-all duration-300 hover:bg-background/20 hover:scale-105">
        <span className="font-display text-2xl font-medium text-background md:text-4xl transition-transform duration-300">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="font-body text-[10px] uppercase tracking-[0.2em] text-background/60">
        {label}
      </span>
    </div>
  );
}
