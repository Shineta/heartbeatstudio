import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import HowItWorks from "@/components/HowItWorks";
import CustomerReviews from "@/components/CustomerReviews";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { Music, Mail, Film } from "lucide-react";
import songPreview from '@assets/generated_images/Song_creator_preview_dfc9ad30.png';
import cardPreview from '@assets/generated_images/Card_maker_preview_e83ca765.png';
import animationPreview from '@assets/generated_images/Animation_maker_preview_2accf1ac.png';

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleTryIt = (type: 'song' | 'card' | 'animation') => {
    if (type === 'animation') {
      setLocation('/auth?returnTo=/create?type=animation');
    } else {
      setLocation(`/try/${type}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <HeroSection />
      
      <section id="features" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Three Ways to Celebrate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Creative tools that make celebrating effortless and personal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Song Creator"
              description="Create personalized 30-60 second songs with custom lyrics, music, and cover art in any style or genre."
              icon={Music}
              imageUrl={songPreview}
              onTryIt={() => handleTryIt('song')}
            />
            <FeatureCard
              title="Card Maker"
              description="Generate beautiful greeting cards with personalized messages and stunning illustrations for any occasion."
              icon={Mail}
              imageUrl={cardPreview}
              onTryIt={() => handleTryIt('card')}
            />
            <FeatureCard
              title="Mini Animations"
              description="Make 10-30 second animated videos with photos, text, and music that bring your celebrations to life."
              icon={Film}
              imageUrl={animationPreview}
              onTryIt={() => handleTryIt('animation')}
            />
          </div>
        </div>
      </section>
      
      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="reviews">
        <CustomerReviews />
      </div>
      
      <div id="pricing">
        <PricingSection />
      </div>
      
      <Footer />
    </div>
  );
}
