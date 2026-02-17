
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useActiveFlashSales } from "@/hooks/useFlashSales";
import { Timer } from "lucide-react";

export function FlashSale() {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation();
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Use the first active flash sale
  const currentSale = flashSales?.[0];

  useEffect(() => {
    if (!currentSale) return;

    const calculateTimeLeft = () => {
      const endDate = new Date(currentSale.ends_at).getTime();
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
  }, [currentSale]);

  if (isLoading || !currentSale) return null;

  return (
    <section className="py-20 bg-[#1A1A1A] text-white overflow-hidden relative font-serif">
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
        
        {/* Badge */}
        <div className="mb-6 border border-white/30 px-6 py-2">
          <span className="text-xs tracking-[0.2em] font-sans uppercase text-white/80">
            Limited Time Offer
          </span>
        </div>
            
        {/* Headlines */}
        <h2 className="text-5xl md:text-7xl font-medium mb-4 tracking-tight">
          {currentSale.discount_percentage}% Off
        </h2>
        
        <p className="text-2xl md:text-3xl text-white/90 mb-12 font-light">
          {currentSale.name}
        </p>

        {/* Countdown Timer */}
        <div className="flex gap-4 md:gap-6 mb-12">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* CTA */}
        <button 
          onClick={() => navigate("/shop")}
          className="border border-white px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-[#1A1A1A] transition-colors duration-300"
        >
          Shop Now
        </button>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-[#2A2A2A] w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-3">
        <span className="text-3xl md:text-4xl font-light">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-white/60 font-sans">
        {label}
      </span>
    </div>
  );
}
