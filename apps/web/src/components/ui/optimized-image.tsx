import { useState, useEffect, useMemo, useRef } from "react";
import type { TransformOptions } from "@supabase/storage-js";
import { cn } from "@/lib/utils";
import { getOptimizedImageSrc } from "@/lib/image";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // If true, eager load and high priority
  className?: string;
  sizes?: string; // Responsive sizes attribute
  transform?: TransformOptions;
  wrapperClassName?: string;
  placeholderClassName?: string;
}

function getResponsiveTransforms(transform?: TransformOptions) {
  if (!transform?.width) {
    return [];
  }

  const candidateWidths = Array.from(
    new Set([
      Math.max(80, Math.round(transform.width / 2)),
      Math.max(120, Math.round(transform.width * 0.75)),
      transform.width,
    ]),
  ).sort((a, b) => a - b);

  return candidateWidths.map((width) => ({
    ...transform,
    width,
    height: transform.height
      ? Math.round((transform.height / transform.width!) * width)
      : undefined,
  }));
}

function getPreviewTransform(transform?: TransformOptions) {
  if (!transform?.width) {
    return undefined;
  }

  const previewWidth = Math.min(48, Math.max(24, Math.round(transform.width / 16)));

  return {
    ...transform,
    width: previewWidth,
    height: transform.height
      ? Math.max(
          24,
          Math.round((transform.height / transform.width!) * previewWidth),
        )
      : undefined,
    quality: Math.min(transform.quality ?? 80, 40),
  };
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
  transform,
  wrapperClassName,
  placeholderClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority); // If priority, visible immediately
  const imgRef = useRef<HTMLImageElement>(null);
  const optimizedSrc = useMemo(
    () => getOptimizedImageSrc(src, transform),
    [src, transform],
  );
  const previewSrc = useMemo(() => {
    const previewTransform = getPreviewTransform(transform);
    return previewTransform ? getOptimizedImageSrc(src, previewTransform) : undefined;
  }, [src, transform]);
  const optimizedSrcSet = useMemo(() => {
    if (!transform?.width) {
      return undefined;
    }

    const candidates = getResponsiveTransforms(transform);

    if (candidates.length <= 1) {
      return undefined;
    }

    return candidates
      .map((candidate) => {
        const candidateSrc = getOptimizedImageSrc(src, candidate);
        return `${candidateSrc} ${candidate.width}w`;
      })
      .join(", ");
  }, [src, transform]);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setIsVisible(priority);
  }, [optimizedSrc, priority]);

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
        rootMargin: "350px", // Start loading before items enter viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, optimizedSrc]);

  // Standard caching: Once the browser fetches the image via the `src` attribute (which we set when visible), 
  // it automatically stores it in the Disk Cache. Next time, it loads instantly from disk.

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted", wrapperClassName)}>
      {!isLoaded && (
        <>
          {previewSrc && (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
              style={{ backgroundImage: `url(${previewSrc})` }}
              aria-hidden="true"
            />
          )}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/35 to-muted/10 animate-pulse",
              placeholderClassName,
            )}
            aria-hidden="true"
          />
        </>
      )}
      <img
        ref={imgRef}
        src={isVisible ? (error ? src : optimizedSrc) : undefined} // Only set src when near viewport
        srcSet={isVisible && !error ? optimizedSrcSet : undefined}
        alt={alt}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!error && optimizedSrc !== src) {
            setError(true);
            return;
          }

          setIsLoaded(true);
        }}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}
