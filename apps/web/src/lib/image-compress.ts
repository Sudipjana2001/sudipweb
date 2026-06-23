/**
 * Client-side image compression utility.
 * Compresses images (Files or URLs) to optimized WebP format using HTML5 Canvas.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

/**
 * Compresses an image file or URL to WebP format.
 * Returns a Blob containing the compressed WebP image.
 */
export async function compressImageToWebP(
  source: File | string,
  options: CompressionOptions = {}
): Promise<Blob> {
  const { maxWidth = 1000, maxHeight = 1000, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Allow loading cross-origin images (important for migrating existing Supabase assets)
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = width / height;
          if (width > height) {
            width = maxWidth;
            height = Math.round(width / ratio);
          } else {
            height = maxHeight;
            width = Math.round(height * ratio);
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context for canvas"));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          },
          "image/webp",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load image source for compression"));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("FileReader result is empty"));
        }
      };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(source);
    } else {
      // If it's a URL, load it directly
      img.src = source;
    }
  });
}
