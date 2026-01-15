import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedCollections } from "@/components/FeaturedCollections";
import { BestSellers } from "@/components/BestSellers";
import { PromoBanner } from "@/components/PromoBanner";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { Testimonials } from "@/components/Testimonials";
import { InstagramFeed } from "@/components/InstagramFeed";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedCollections />
        <BestSellers />
        <PersonalizedRecommendations />
        <PromoBanner />
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
