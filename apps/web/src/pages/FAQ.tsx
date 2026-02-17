import { useState } from "react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useFAQs } from "@/hooks/useFAQs";
import { ChevronDown, Search, HelpCircle, Package, Truck, RotateCcw, Ruler, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  ordering: { label: "Ordering", icon: Package },
  shipping: { label: "Shipping", icon: Truck },
  returns: { label: "Returns & Exchanges", icon: RotateCcw },
  sizing: { label: "Sizing", icon: Ruler },
  payments: { label: "Payments", icon: CreditCard },
  general: { label: "General", icon: HelpCircle },
};

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: faqs = [], isLoading } = useFAQs();

  const categories = [...new Set(faqs.map((f) => f.category))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      !searchQuery.trim() ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <PageLayout>
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Help Center
          </p>
          <h1 className="mb-4 font-display text-5xl font-medium tracking-tight md:text-6xl">
            How can we help?
          </h1>
          <p className="mx-auto mb-8 max-w-xl font-body text-lg text-muted-foreground">
            Find answers to frequently asked questions about orders, shipping, returns, and more.
          </p>

          {/* Search */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers..."
              className="w-full border border-border bg-background py-4 pl-12 pr-4 font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="container mx-auto px-6">
          {/* Category Pills */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm transition-colors",
                !selectedCategory
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              All Topics
            </button>
            {categories.map((cat) => {
              const config = categoryConfig[cat] || categoryConfig.general;
              const Icon = config.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm transition-colors",
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="py-20 text-center">
              <HelpCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-2 font-display text-2xl">No results found</p>
              <p className="font-body text-muted-foreground">
                Try adjusting your search or browse all topics
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              {Object.entries(groupedFAQs).map(([category, categoryFaqs]) => {
                const config = categoryConfig[category] || categoryConfig.general;
                const Icon = config.icon;
                return (
                  <div key={category}>
                    <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
                      <Icon className="h-5 w-5" />
                      {config.label}
                    </h2>
                    <div className="space-y-2">
                      {categoryFaqs
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((faq) => (
                          <div
                            key={faq.id}
                            className="border border-border bg-card"
                          >
                            <button
                              onClick={() =>
                                setExpandedId(expandedId === faq.id ? null : faq.id)
                              }
                              className="flex w-full items-center justify-between p-4 text-left"
                            >
                              <span className="font-body font-medium pr-4">
                                {faq.question}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 shrink-0 transition-transform",
                                  expandedId === faq.id && "rotate-180"
                                )}
                              />
                            </button>
                            {expandedId === faq.id && (
                              <div className="border-t border-border px-4 py-4">
                                <p className="font-body text-muted-foreground whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact CTA */}
          <div className="mx-auto mt-16 max-w-2xl rounded-lg border border-border bg-muted p-8 text-center">
            <h3 className="mb-2 font-display text-2xl">Still have questions?</h3>
            <p className="mb-6 font-body text-muted-foreground">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-foreground px-8 py-3 font-body text-sm text-background transition-opacity hover:opacity-90"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
