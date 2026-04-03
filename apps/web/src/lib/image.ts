import type { TransformOptions } from "@supabase/storage-js";
import { supabase } from "@/integrations/client";

const SUPABASE_PUBLIC_IMAGE_PATH =
  /\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/;
const UNSPLASH_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com"]);

function getSupabaseImageParts(src: string) {
  try {
    const url = new URL(src);
    const match = url.pathname.match(SUPABASE_PUBLIC_IMAGE_PATH);

    if (!match) {
      return null;
    }

    return {
      bucket: match[1],
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function getUnsplashImageUrl(src: string, transform: TransformOptions) {
  try {
    const url = new URL(src);

    if (!UNSPLASH_HOSTS.has(url.hostname)) {
      return src;
    }

    if (transform.width) {
      url.searchParams.set("w", String(transform.width));
    }

    if (transform.height) {
      url.searchParams.set("h", String(transform.height));
    }

    if (transform.quality) {
      url.searchParams.set("q", String(transform.quality));
    }

    if (transform.resize === "contain") {
      url.searchParams.set("fit", "max");
    } else {
      url.searchParams.set("fit", "crop");
    }

    url.searchParams.set("auto", "format");

    return url.toString();
  } catch {
    return src;
  }
}

export function getOptimizedImageSrc(
  src: string,
  transform?: TransformOptions,
) {
  if (!src || !transform || src.startsWith("/")) {
    return src;
  }

  const supabaseImage = getSupabaseImageParts(src);

  if (supabaseImage) {
    return supabase.storage
      .from(supabaseImage.bucket)
      .getPublicUrl(supabaseImage.path, { transform }).data.publicUrl;
  }

  return getUnsplashImageUrl(src, transform);
}
