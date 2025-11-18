import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="text-xl font-semibold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Heartbeat Studio
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                console.log('Navigate to Features');
              }}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                console.log('Navigate to How It Works');
              }}
            >
              How It Works
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                console.log('Navigate to Pricing');
              }}
            >
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => console.log('Sign in clicked')}
              data-testid="button-sign-in"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => console.log('Get started clicked')}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigate to Features');
                  setMobileMenuOpen(false);
                }}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigate to How It Works');
                  setMobileMenuOpen(false);
                }}
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigate to Pricing');
                  setMobileMenuOpen(false);
                }}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => console.log('Sign in clicked')}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => console.log('Get started clicked')}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
