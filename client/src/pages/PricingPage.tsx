import Navigation from "@/components/Navigation";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <div className="pt-8">
        <PricingSection />
      </div>
      
      <Footer />
    </div>
  );
}
