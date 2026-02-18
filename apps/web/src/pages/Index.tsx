import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedCollections } from "@/components/FeaturedCollections";
import { BestSellers } from "@/components/BestSellers";
import { PromoBanner } from "@/components/PromoBanner";
import { FlashSale } from "@/components/FlashSale";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { Testimonials } from "@/components/Testimonials";
import { InstagramFeed } from "@/components/InstagramFeed";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { SEOHead } from "@/components/SEOHead";

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pebric",
    url: "https://pebric.vercel.app",
    logo: "https://pebric.vercel.app/favicon.ico",
    description: "Premium matching outfits for pets and their owners.",
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pebric",
    url: "https://pebric.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://pebric.vercel.app/shop?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pebric — Premium Matching Outfits for Pets & Owners"
        description="Discover premium matching outfits for you and your pet. Shop our exclusive Pebric collections — summer, winter, and rainy season styles. Where pets & style twin."
        keywords="pet clothing, matching outfits, pet fashion, matching pet outfits, dog clothes, pet owner matching, premium pet apparel, Pebric"
        jsonLd={homeJsonLd}
      />
      <Header />
      <main>
        <HeroSection />
        <FeaturedCollections />
        <BestSellers />
        <PersonalizedRecommendations />
        <PromoBanner />
        <FlashSale />
        <WhyChooseUs />
        <Testimonials />
        <InstagramFeed />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
