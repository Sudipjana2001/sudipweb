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

  // Hardcoded banner for immediate revert
  const banner = {
    badge_text: "Limited Time Offer",
    headline: "Spring Sale is Live",
    subheadline: "Get 20% off all new arrivals with code SPRING20",
    end_date: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    background_color: "#f3f4f6",
    text_color: "#1f2937",
    cta_text: "Shop Now",
    cta_link: "/shop"
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(banner.end_date).getTime();
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
  }, []);

  return (
    <section 
      className="py-16 md:py-20 overflow-hidden"
      style={{ 
        backgroundColor: banner.background_color,
        color: banner.text_color
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
            className="mb-6 inline-block border px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.3em] animate-pulse"
            style={{
              borderColor: `${banner.text_color}30`,
              color: `${banner.text_color}70`
            }}
          >
            {banner.badge_text}
          </span>

          {/* Headline */}
          <h2 className="mb-4 font-display text-4xl font-medium tracking-tight md:text-6xl">
            {banner.headline}
          </h2>
          {banner.subheadline && (
            <p className="mb-10 font-display text-xl md:text-2xl opacity-80">
              {banner.subheadline}
            </p>
          )}

          {/* Countdown Timer */}
          <div className="mb-10 flex gap-4 md:gap-8">
            <TimeUnit value={timeLeft.days} label="Days" index={0} isVisible={isVisible} color={banner.text_color} bgColor={banner.background_color} />
            <TimeUnit value={timeLeft.hours} label="Hours" index={1} isVisible={isVisible} color={banner.text_color} bgColor={banner.background_color} />
            <TimeUnit value={timeLeft.minutes} label="Minutes" index={2} isVisible={isVisible} color={banner.text_color} bgColor={banner.background_color} />
            <TimeUnit value={timeLeft.seconds} label="Seconds" index={3} isVisible={isVisible} color={banner.text_color} bgColor={banner.background_color} />
          </div>

          {/* CTA */}
          {banner.cta_text && banner.cta_link && (
            <Button 
              variant="hero-outline" 
              style={{
                borderColor: banner.text_color,
                color: banner.text_color
              }}
              className="hover:opacity-90"
              onClick={() => navigate(banner.cta_link)}
            >
              {banner.cta_text}
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
