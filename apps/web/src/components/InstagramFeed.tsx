import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useInstagramPosts } from "@/hooks/useInstagramPosts";

export function InstagramFeed() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({
    threshold: 0.05,
  });
  const { data: instagramPosts = [], isLoading } = useInstagramPosts();

  if (!isLoading && instagramPosts.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`mb-12 text-center transition-all duration-700 ${
            headerVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            @PebricPets
          </p>
          <h2 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Join Our Community
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Tag us in your Pebric moments for a chance to be featured
          </p>
        </div>

        {/* Instagram Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          {instagramPosts.map((post, index) => (
            <a
              key={post.id}
              href={post.post_url}
              target="_blank"
              rel="noreferrer"
              className={`group relative aspect-square cursor-pointer overflow-hidden bg-muted transition-all duration-700 hover:shadow-elevated ${
                gridVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 75}ms` }}
              aria-label={post.caption || "Open Instagram post"}
            >
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${post.image_url})` }}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/80 opacity-0 transition-all duration-500 group-hover:opacity-100">
                <Instagram className="mb-2 h-6 w-6 text-background transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                <span className="font-body text-sm text-background transition-transform duration-300 group-hover:-translate-y-0.5">
                  {post.likes_count.toLocaleString()} likes
                </span>
                {post.caption && (
                  <span className="mt-2 px-4 text-center font-body text-xs text-background/80 line-clamp-2">
                    {post.caption}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            gridVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {instagramPosts[0]?.post_url && (
            <Button
              variant="premium-outline"
              size="lg"
              className="group"
              asChild
            >
              <a
                href={instagramPosts[0].post_url}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                Follow Us on Instagram
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
