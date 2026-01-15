import { useWeatherSuggestions } from "@/hooks/useWeatherSuggestions";
import { useNavigate } from "react-router-dom";
import { Cloud, Sun, CloudRain, Snowflake, Thermometer } from "lucide-react";

const weatherIcons: Record<string, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  cold: Snowflake,
  hot: Thermometer,
};

export function WeatherBanner() {
  const { weather, suggestions } = useWeatherSuggestions();
  const navigate = useNavigate();

  if (!weather || suggestions.length === 0) return null;

  const suggestion = suggestions[0];
  const WeatherIcon = weatherIcons[weather.condition] || Cloud;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <WeatherIcon className="h-5 w-5" />
              <span className="font-medium">{weather.temperature}°C</span>
            </div>
            <span className="text-sm text-muted-foreground">|</span>
            <p className="text-sm">
              <span className="text-lg mr-2">{suggestion.icon}</span>
              {suggestion.message}
            </p>
          </div>
          <button
            onClick={() => navigate(`/shop?collection=${weather.condition}`)}
            className="hidden sm:block text-sm font-medium underline-offset-4 hover:underline"
          >
            Shop Now →
          </button>
        </div>
      </div>
    </div>
  );
}
