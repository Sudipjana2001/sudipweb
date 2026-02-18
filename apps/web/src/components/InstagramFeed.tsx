import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const instagramPosts = [
  { id: 1, image: "/insta-1.jpg", likes: 1247 },
  { id: 2, image: "/insta-2.jpg", likes: 892 },
  { id: 3, image: "/insta-3.jpg", likes: 2103 },
  { id: 4, image: "/insta-4.jpg", likes: 1568 },
  { id: 5, image: "/insta-5.jpg", likes: 943 },
  { id: 6, image: "/insta-6.jpg", likes: 1789 },
];

export function InstagramFeed() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.05 });

  return (
    <section className="bg-background py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`mb-12 text-center transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
        <div ref={gridRef} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {instagramPosts.map((post, index) => (
            <div
              key={post.id}
              className={`group relative aspect-square cursor-pointer overflow-hidden bg-muted transition-all duration-700 hover:shadow-elevated ${
                gridVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
              style={{ transitionDelay: `${index * 75}ms` }}
            >
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${post.image})` }}
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/80 opacity-0 transition-all duration-500 group-hover:opacity-100">
                <Instagram className="mb-2 h-6 w-6 text-background transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                <span className="font-body text-sm text-background transition-transform duration-300 group-hover:-translate-y-0.5">
                  {post.likes.toLocaleString()} likes
                </span>
              </div>
            </div>
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
    </section>
  );
}
