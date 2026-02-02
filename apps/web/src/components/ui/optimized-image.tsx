import { useState, useEffect } from "react";
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

  // If priority is true (eager), we might want to skip fade-in entirely or check immediately
  // But standard way for cached images is checking .complete ref
  const imgRef = (node: HTMLImageElement | null) => {
    if (node && node.complete) {
      setIsLoaded(true);
    }
  };

  // Fallback to simpler loading if error
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
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={sizes}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      className={cn(
        "transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );
}
