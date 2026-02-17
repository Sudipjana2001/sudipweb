
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-6 py-12">
        <h1 className="text-4xl font-display font-medium mb-8">Privacy Policy</h1>
        <div className="prose max-w-none">
          <p>Your privacy is important to us. This is a placeholder for the privacy policy.</p>
          {/* Add more content here */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
