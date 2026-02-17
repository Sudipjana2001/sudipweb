
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-6 py-12">
        <h1 className="text-4xl font-display font-medium mb-8">Terms of Service</h1>
        <div className="prose max-w-none">
          <p>These are the terms of service. This is a placeholder.</p>
          {/* Add more content here */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
