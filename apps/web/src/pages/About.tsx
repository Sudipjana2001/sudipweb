import { Link } from "react-router-dom";
import { Heart, Star, Shield, Truck, RotateCcw, Leaf } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Heart,
    title: "Pet Love First",
    description: "Every design starts with your pet's comfort in mind. We test all our products with real pets to ensure they're happy and comfortable.",
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "We source only the finest materials, from organic cotton to premium fleece, ensuring durability and comfort for both you and your pet.",
  },
  {
    icon: Leaf,
    title: "Sustainable Practice",
    description: "Our commitment to the environment means eco-friendly materials, minimal packaging, and carbon-neutral shipping on all orders.",
  },
];

const stats = [
  { value: "50K+", label: "Happy Families" },
  { value: "100+", label: "Twinning Designs" },
  { value: "25+", label: "Countries Served" },
  { value: "4.9", label: "Average Rating" },
];

export default function About() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px]">
        <div className="absolute inset-0">
          <img
            src="/hero-1.jpg"
            alt="About Twinning"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/50" />
        </div>
        <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-background/80">
            Our Story
          </p>
          <h1 className="mb-6 font-display text-5xl font-medium tracking-tight text-background md:text-7xl">
            About Twinning
          </h1>
          <p className="max-w-2xl font-body text-lg text-background/90">
            Where the bond between pet and owner becomes a fashion statement.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Est. 2020
              </p>
              <h2 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
                Born from Love
              </h2>
              <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                <p>
                  Twinning started with a simple idea: what if pet owners could share more than just love with their furry companions? What if they could share their style too?
                </p>
                <p>
                  Founded by a pet-loving couple who struggled to find quality matching outfits for themselves and their golden retriever, Luna, we set out to create a brand that celebrates the unique bond between pets and their humans.
                </p>
                <p>
                  Today, we're proud to dress thousands of twinning duos around the world, from sunny California beaches to cozy European winters.
                </p>
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden bg-muted lg:aspect-auto">
              <img
                src="/hero-2.jpg"
                alt="Our journey"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              What We Stand For
            </p>
            <h2 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
              Our Values
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="bg-background p-8">
                <value.icon className="mb-6 h-10 w-10 text-foreground" />
                <h3 className="mb-4 font-display text-xl font-medium">{value.title}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="mb-2 font-display text-5xl font-medium md:text-6xl">
                  {stat.value}
                </p>
                <p className="font-body text-sm uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-foreground py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-4xl font-medium tracking-tight text-background md:text-5xl">
              Why Choose Us
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On all orders over ₹100" },
              { icon: Shield, title: "Quality Guarantee", desc: "30-day satisfaction promise" },
              { icon: RotateCcw, title: "Easy Returns", desc: "No questions asked" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <item.icon className="mx-auto mb-4 h-8 w-8 text-background/70" />
                <h3 className="mb-2 font-display text-lg font-medium text-background">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-background/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-6 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Ready to Start Twinning?
          </h2>
          <p className="mb-10 font-body text-lg text-muted-foreground">
            Explore our collections and find the perfect matching look.
          </p>
          <Link to="/shop">
            <Button variant="hero" size="lg">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
