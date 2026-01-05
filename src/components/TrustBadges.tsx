import { ShieldCheck, Award, Truck, RefreshCcw } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "100% Secure",
    description: "SSL encrypted checkout",
  },
  {
    icon: Award,
    title: "Quality Guaranteed",
    description: "Premium materials only",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "2-5 business days",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    description: "14-day return policy",
  },
];

export function TrustBadges() {
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.title} className="flex items-center gap-3 justify-center text-center md:text-left md:justify-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
