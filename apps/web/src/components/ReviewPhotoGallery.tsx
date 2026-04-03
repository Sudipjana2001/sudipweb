import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ReviewPhotoGalleryProps {
  photos: string[];
  thumbnailSize?: "sm" | "md";
}

const thumbnailClassNames = {
  sm: "h-20 w-20",
  md: "h-24 w-24",
};

export function ReviewPhotoGallery({
  photos,
  thumbnailSize = "sm",
}: ReviewPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const showPrevious = () => {
    setSelectedIndex((current) => {
      if (current === null) return 0;
      return current === 0 ? photos.length - 1 : current - 1;
    });
  };

  const showNext = () => {
    setSelectedIndex((current) => {
      if (current === null) return 0;
      return current === photos.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <button
            key={`${photo}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-foreground",
              thumbnailClassNames[thumbnailSize],
            )}
            aria-label={`Open review photo ${index + 1}`}
          >
            <OptimizedImage
              src={photo}
              alt={`Review photo ${index + 1}`}
              sizes={thumbnailSize === "md" ? "96px" : "80px"}
              transform={{ width: 192, height: 192, quality: 72, resize: "cover" }}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl border-none bg-background/95 p-3 shadow-2xl sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-muted-foreground">
              Review Photo {selectedIndex !== null ? selectedIndex + 1 : 1} of{" "}
              {photos.length}
            </DialogTitle>
          </DialogHeader>

          {selectedIndex !== null && (
            <div className="space-y-3">
              <div className="relative flex min-h-[55vh] items-center justify-center overflow-hidden rounded-xl bg-muted/40 p-2">
                <OptimizedImage
                  src={photos[selectedIndex]}
                  alt={`Review photo ${selectedIndex + 1}`}
                  priority
                  sizes="(max-width: 768px) 92vw, 76vw"
                  transform={{ width: 1440, height: 1440, quality: 84, resize: "contain" }}
                  className="max-h-[78vh] w-full object-contain"
                  wrapperClassName="max-h-[78vh] bg-transparent"
                  placeholderClassName="bg-muted/20"
                />

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevious}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-preview-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                        index === selectedIndex
                          ? "border-foreground"
                          : "border-transparent hover:border-border",
                      )}
                      aria-label={`View photo ${index + 1}`}
                    >
                      <OptimizedImage
                        src={photo}
                        alt={`Preview photo ${index + 1}`}
                        sizes="64px"
                        transform={{ width: 128, height: 128, quality: 70, resize: "cover" }}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
