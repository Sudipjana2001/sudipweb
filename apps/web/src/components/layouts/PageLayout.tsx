import { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Newsletter } from "@/components/Newsletter";
import { CompareBar } from "@/components/CompareBar";

interface PageLayoutProps {
  children: ReactNode;
  showNewsletter?: boolean;
}

export function PageLayout({ children, showNewsletter = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">{children}</main>
      {showNewsletter && <Newsletter />}
      <Footer />
      <CompareBar />
    </div>
  );
}
