import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useInstagramPosts } from "@/hooks/useInstagramPosts";

const DEFAULT_POSTS = [
  {
    image_url: "/gallery-1.jpg",
    caption: "Sunday vibes with the squad 🐾 #PebricStyle",
    post_url: "https://instagram.com",
    likes_count: 245
  },
  {
    image_url: "/gallery-2.jpg",
    caption: "Twinning is winning! Shop the new collection now.",
    post_url: "https://instagram.com",
    likes_count: 189
  },
  {
    image_url: "/gallery-3.jpg",
    caption: "Behind the scenes of our latest photoshoot.",
    post_url: "https://instagram.com",
    likes_count: 312
  },
  {
    image_url: "/gallery-4.jpg",
    caption: "Customer spotlight: Look at how cute Max looks!",
    post_url: "https://instagram.com",
    likes_count: 567
  },
];

export function InstagramFeed() {
  const { ref, isVisible } = useScrollAnimation();
  const { data: dbPosts, isLoading } = useInstagramPosts();

  // Use database posts if available, otherwise fallback
  const posts = (dbPosts && dbPosts.length > 0) ? dbPosts : DEFAULT_POSTS;

  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div 
          ref={ref}
          className={`flex flex-col items-center text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="mb-6 flex items-center justify-center gap-2 text-primary">
            <Instagram className="h-6 w-6" />
            <span className="font-body text-xs uppercase tracking-[0.2em]">@PebricOfficial</span>
          </div>
          
          <h2 className="mb-16 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Join the <span className="text-secondary-foreground">Pack</span>
          </h2>

          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
            {posts.map((post, index) => (
              <a
                key={index}
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-110"
                  style={{ backgroundImage: `url(${post.image_url})` }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex items-center gap-2 text-white">
                    <span className="font-medium">❤️ {post.likes_count}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

        {/* CTA */}
        <div 
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button variant="premium-outline" size="lg" className="group">
            <Instagram className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            Follow Us on Instagram
          </Button>
        </div>
        </div>
      </div>
    </section>
  );
}
