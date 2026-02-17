import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // If true, eager load and high priority
  className?: string;
  sizes?: string; // Responsive sizes attribute
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority); // If priority, visible immediately
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return; // Skip observer if priority

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before items enter viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Standard caching: Once the browser fetches the image via the `src` attribute (which we set when visible), 
  // it automatically stores it in the Disk Cache. Next time, it loads instantly from disk.

  if (error) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("bg-muted", className)}
        {...props}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined} // Only set src when near viewport
      alt={alt}
      loading={priority ? "eager" : undefined} // Custom lazy loader handles "lazy"
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={sizes}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      className={cn(
        "transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0", // Fade in effect
        // Add a placeholder color/style while loading if not loaded
        !isLoaded && "bg-muted/20", 
        className
      )}
      {...props}
    />
  );
}
