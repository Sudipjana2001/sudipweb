import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePromoBanners } from "@/hooks/usePromoBanners";

export function PromoBanner() {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation();
  const { data: dbBanners, isLoading } = usePromoBanners();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Use the first active banner from the database, or fall back to a default if loading/empty
  // strictly for development/demo purposes if needed, but ideally we show nothing if no banner.
  const currentBanner = dbBanners?.[0];

  useEffect(() => {
    if (!currentBanner) return;

    const calculateTimeLeft = () => {
      const endDate = new Date(currentBanner.end_date).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentBanner]);

  if (isLoading || !currentBanner) return null;

  return (
    <section 
      className="py-16 md:py-20 overflow-hidden"
      style={{ 
        backgroundColor: currentBanner.background_color,
        color: currentBanner.text_color
      }}
    >
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`flex flex-col items-center text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Badge */}
          <span 
            className="mb-6 inline-block border-2 px-5 py-2 font-body text-xs font-semibold uppercase tracking-[0.25em]"
            style={{
              borderColor: currentBanner.text_color,
              color: currentBanner.text_color,
              backgroundColor: `${currentBanner.text_color}10`
            }}
          >
            {currentBanner.badge_text}
          </span>

          {/* Headline */}
          <h2 className="mb-4 font-display text-4xl font-medium tracking-tight md:text-6xl">
            {currentBanner.headline}
          </h2>
          {currentBanner.subheadline && (
            <p className="mb-10 font-display text-xl md:text-2xl opacity-80">
              {currentBanner.subheadline}
            </p>
          )}

          {/* Countdown Timer */}
          <div className="mb-10 flex gap-4 md:gap-8">
            <TimeUnit value={timeLeft.days} label="Days" index={0} isVisible={isVisible} color={currentBanner.text_color} bgColor={currentBanner.background_color} />
            <TimeUnit value={timeLeft.hours} label="Hours" index={1} isVisible={isVisible} color={currentBanner.text_color} bgColor={currentBanner.background_color} />
            <TimeUnit value={timeLeft.minutes} label="Minutes" index={2} isVisible={isVisible} color={currentBanner.text_color} bgColor={currentBanner.background_color} />
            <TimeUnit value={timeLeft.seconds} label="Seconds" index={3} isVisible={isVisible} color={currentBanner.text_color} bgColor={currentBanner.background_color} />
          </div>

          {/* CTA */}
          {currentBanner.cta_text && currentBanner.cta_link && (
            <Button 
              variant="hero-outline" 
              style={{
                borderColor: currentBanner.text_color,
                color: currentBanner.text_color
              }}
              className="hover:opacity-90"
              onClick={() => navigate(currentBanner.cta_link!)}
            >
              {currentBanner.cta_text}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label, index, isVisible, color, bgColor }: { 
  value: number; 
  label: string; 
  index: number; 
  isVisible: boolean;
  color: string;
  bgColor: string;
}) {
  return (
    <div 
      className={`flex flex-col items-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100 + 200}ms` }}
    >
      <div 
        className="mb-2 flex h-16 w-16 items-center justify-center md:h-20 md:w-20 transition-all duration-300 hover:scale-105"
        style={{ backgroundColor: `${color}10` }}
      >
        <span 
          className="font-display text-2xl font-medium md:text-4xl transition-transform duration-300"
          style={{ color }}
        >
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span 
        className="font-body text-[10px] uppercase tracking-[0.2em] opacity-60"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
