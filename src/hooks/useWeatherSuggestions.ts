import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useState, useEffect } from "react";

export interface WeatherSuggestion {
  id: string;
  weather_condition: string;
  temperature_min: number | null;
  temperature_max: number | null;
  suggested_collection_id: string | null;
  suggested_category_id: string | null;
  message: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

interface WeatherData {
  condition: string;
  temperature: number;
  location: string;
}

export function useWeatherSuggestions() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Get weather based on user location (simplified - would use real API in production)
  useEffect(() => {
    // Simulated weather - in production, use OpenWeatherMap or similar
    const conditions = ['sunny', 'cloudy', 'rainy', 'cold', 'hot'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 35) + 5;
    
    setWeather({
      condition: randomCondition,
      temperature: randomTemp,
      location: 'Your Area',
    });
  }, []);

  const suggestionsQuery = useQuery({
    queryKey: ["weather-suggestions", weather?.condition],
    queryFn: async () => {
      if (!weather) return [];
      
      const { data, error } = await supabase
        .from("weather_suggestions")
        .select("*")
        .eq("weather_condition", weather.condition)
        .eq("is_active", true);

      if (error) throw error;
      return data as WeatherSuggestion[];
    },
    enabled: !!weather,
  });

  return {
    weather,
    suggestions: suggestionsQuery.data || [],
    isLoading: suggestionsQuery.isLoading,
  };
}
