import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_celebration_scene_ec9c5bad.png";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-col items-center gap-1 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">Heartbeat Studio</span>
            </div>
            <span className="text-xs text-primary-foreground/80">by Horton's Tech Innovations</span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Create magic for the<br />people you love—instantly.
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Beautiful, personalized celebrations powered by AI. Generate songs, cards, and animations in seconds—then schedule them to send at the perfect moment.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-base px-8 rounded-full"
            data-testid="button-start-creating"
            onClick={() => console.log('Start creating clicked')}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Creating Free
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-base px-8 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            data-testid="button-see-how-it-works"
            onClick={() => console.log('See how it works clicked')}
          >
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  );
}
