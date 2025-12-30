import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MessageSquare, Sparkles, Music, Share2, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      icon: MessageSquare,
      title: "Tell Us About Your Song",
      description: "Share who the song is for, the occasion, and any special details you want included. Pick a genre and tone that fits the vibe you're going for."
    },
    {
      number: "2",
      icon: Sparkles,
      title: "Answer AI Questions",
      description: "Our AI generates personalized follow-up questions based on your initial details. Your answers help us create lyrics that are truly meaningful and unique."
    },
    {
      number: "3",
      icon: Music,
      title: "Review & Generate",
      description: "Preview your custom lyrics before generation. Once you're happy, we'll create a full-length song with professional vocals and unique cover art."
    },
    {
      number: "4",
      icon: Share2,
      title: "Share the Magic",
      description: "Get a shareable link to send your creation. Schedule delivery for the perfect moment, or share it instantly with a tap."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              How It Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Creating a personalized song takes just a few minutes. Here's how the magic happens.
            </p>
          </div>

          <div className="space-y-12 mb-16">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-8 pt-16">
                    <ArrowRight className="w-5 h-5 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Ready to Create Something Special?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start with 3 free songs—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" data-testid="button-howitworks-start">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" data-testid="link-howitworks-pricing">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
