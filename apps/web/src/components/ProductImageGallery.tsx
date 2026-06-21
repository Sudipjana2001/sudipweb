import React, { useState, useEffect, useRef, useMemo } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Heart,
  Share2,
  ZoomIn,
  ZoomOut,
  X,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_IMAGE_TRANSFORM = {
  width: 960,
  height: 960,
  quality: 80,
  resize: "cover" as const,
};

const PRODUCT_THUMBNAIL_TRANSFORM = {
  width: 120,
  height: 120,
  quality: 55,
  resize: "cover" as const,
};

const PRODUCT_THUMBNAIL_SIZES = "(max-width: 640px) 18vw, 80px";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  inWishlist?: boolean;
  onWishlistToggle?: () => void;
  onShare?: () => void;
}

export function ProductImageGallery({
  images,
  productName,
  inWishlist,
  onWishlistToggle,
  onShare,
}: ProductImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Desktop Hover Zoom States
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 50, y: 50 });

  // Mobile/Modal Touch Zoom States
  const [scale, setScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });

  // Swipe gesture variables
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);
  const touchStartPan = useRef({ x: 0, y: 0 });
  const isPinching = useRef<boolean>(false);
  const lastTap = useRef<number>(0);

  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Show swipe hint on mobile mount
  useEffect(() => {
    if (window.innerWidth < 768 && images.length > 1) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused on input/textarea elements
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, currentImage, isModalOpen]);

  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetZoom();
  };

  const resetZoom = () => {
    setScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  // Desktop Hover Zoom handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPos({ x, y });
  };

  // Mobile/Modal Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartPan.current = { ...panPos };
      isPinching.current = false;
    } else if (e.touches.length === 2) {
      isPinching.current = true;
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      touchStartDist.current = Math.hypot(x2 - x1, y2 - y1);
      touchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && !isPinching.current) {
      if (scale > 1) {
        // Pan the image
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;

        const newX = touchStartPan.current.x + dx;
        const newY = touchStartPan.current.y + dy;

        const container = e.currentTarget;
        const maxX = ((scale - 1) * container.clientWidth) / 2;
        const maxY = ((scale - 1) * container.clientHeight) / 2;

        setPanPos({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    } else if (e.touches.length === 2 && isPinching.current) {
      // Pinch to zoom
      if (touchStartDist.current === null) return;
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      const factor = dist / touchStartDist.current;
      const newScale = Math.max(1, Math.min(3.5, touchStartScale.current * factor));
      setScale(newScale);

      if (newScale === 1) {
        setPanPos({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      if (!isPinching.current && scale === 1) {
        // Detect swipe
        if (touchStartX.current === null || touchStartY.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX.current;
        const dy = touchEndY - touchStartY.current;

        const minSwipeDistance = 50;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
          if (dx < 0) {
            nextImage();
          } else {
            prevImage();
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      touchStartDist.current = null;
      isPinching.current = false;
    }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2.5);
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  // Preload next image LCP optimization
  useEffect(() => {
    if (images.length === 0) return;
    const preloadUrls = [
      images[currentImage],
      images[(currentImage + 1) % images.length],
    ];
    preloadUrls.forEach((url) => {
      if (!url) return;
      const img = new window.Image();
      img.src = url;
    });
  }, [currentImage, images]);

  return (
    <div className="space-y-4">
      {/* Main image box */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted group rounded-2xl border border-border">
        {/* Navigation chevrons (desktop only) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background group-hover:opacity-100 hover:scale-105"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background group-hover:opacity-100 hover:scale-105"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Favorite & Share Buttons */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle();
            }}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background hover:scale-105"
            aria-label="Add to favorites"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                inWishlist ? "fill-destructive text-destructive" : "text-foreground"
              )}
            />
          </button>
        )}

        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="absolute right-4 top-16 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background hover:scale-105"
            aria-label="Share product link"
          >
            <Share2 className="h-5 w-5 text-foreground" />
          </button>
        )}

        {/* Zoom Overlay controls & expand hints */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute left-4 bottom-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background hover:scale-105 opacity-0 group-hover:opacity-100 duration-300"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Swipe hint for Mobile */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-500",
            showSwipeHint ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
            <p className="text-xs font-medium text-foreground flex items-center gap-2">
              <Minus className="w-4 h-4" /> Swipe to view <Minus className="w-4 h-4" />
            </p>
          </div>
        </div>

        {/* The interactive main image */}
        <div
          className="h-full w-full cursor-zoom-in overflow-hidden touch-pan-y select-none"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            resetZoom();
          }}
          onClick={(e) => {
            // Avoid triggering full-screen if double tapping
            if (e.detail === 1) {
              // Wait short moment to check if it is part of a double tap
              setTimeout(() => {
                if (lastTap.current === 0) {
                  setIsModalOpen(true);
                }
              }, 200);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="h-full w-full transition-transform duration-300 ease-out will-change-transform"
            style={{
              transformOrigin: isHovered ? `${hoverPos.x}% ${hoverPos.y}%` : "center center",
              transform: isHovered ? "scale(2.3)" : `scale(${scale}) translate3d(${panPos.x}px, ${panPos.y}px, 0)`,
              transition: isHovered ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <OptimizedImage
              src={images[currentImage]}
              alt={productName}
              priority={true}
              sizes="(max-width: 768px) 100vw, 30vw"
              transform={PRODUCT_IMAGE_TRANSFORM}
              className="h-full w-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Indicator dots for Mobile view */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex gap-1.5 md:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentImage === idx ? "bg-foreground w-3.5" : "bg-foreground/30"
                )}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails grid */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentImage(idx);
                resetZoom();
              }}
              className={cn(
                "relative aspect-square w-16 md:w-20 shrink-0 overflow-hidden border-2 transition-all rounded-lg snap-start hover:border-foreground/60",
                currentImage === idx ? "border-foreground scale-[0.98]" : "border-transparent"
              )}
            >
              <OptimizedImage
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                priority={idx === currentImage}
                sizes={PRODUCT_THUMBNAIL_SIZES}
                loading={idx === currentImage ? "eager" : "lazy"}
                transform={PRODUCT_THUMBNAIL_TRANSFORM}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-Screen Premium Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetZoom();
      }}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] sm:max-w-[95vw] sm:w-[95vw] sm:h-[95vh] p-0 border-none bg-black/95 text-white flex flex-col items-center justify-between overflow-hidden z-50 rounded-none sm:rounded-2xl select-none">
          {/* Modal Header */}
          <div className="w-full flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 z-50">
            <span className="font-display text-sm tracking-wide font-medium text-white/90 truncate max-w-[70vw]">
              {productName} ({currentImage + 1} / {images.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (scale > 1) {
                    resetZoom();
                  } else {
                    setScale(2.5);
                  }
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
                title="Zoom image"
              >
                {scale > 1 ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Active image & side controls */}
          <div className="w-full flex-1 flex items-center justify-center relative overflow-hidden p-4">
            {/* Nav Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/80 border border-white/15 transition-all hover:bg-black/80 hover:text-white hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/80 border border-white/15 transition-all hover:bg-black/80 hover:text-white hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main zoomable area */}
            <div
              className="w-full h-full max-w-[85vw] max-h-[75vh] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleDoubleTap}
            >
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
                style={{
                  transform: `scale(${scale}) translate3d(${panPos.x}px, ${panPos.y}px, 0)`,
                }}
              >
                <img
                  src={images[currentImage]}
                  alt={productName}
                  className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-sm"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Modal Bottom: Thumbnails */}
          {images.length > 1 && (
            <div className="w-full py-4 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center gap-3 absolute bottom-0 left-0 z-40">
              <div className="flex gap-2 overflow-x-auto max-w-[90vw] px-4 pb-1 scrollbar-hide snap-x">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentImage(idx);
                      resetZoom();
                    }}
                    className={cn(
                      "relative aspect-square w-14 sm:w-16 shrink-0 overflow-hidden border-2 rounded-lg transition-all snap-start",
                      currentImage === idx
                        ? "border-white scale-95"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`Modal view ${idx + 1}`}
                      priority={idx === currentImage}
                      sizes="80px"
                      transform={PRODUCT_THUMBNAIL_TRANSFORM}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
