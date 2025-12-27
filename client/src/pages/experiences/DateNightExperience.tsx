import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles, Music, Image, Link2, ArrowLeft, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface StripeProduct {
  id: string;
  name: string;
  prices: {
    id: string;
    unit_amount: number;
  }[];
}

export default function DateNightExperience() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products'],
  });

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase this experience.",
      });
      setLocation('/auth');
      return;
    }

    const stripeProduct = productsData?.products?.find(p => p.name === "Date Night Kit");
    
    if (!stripeProduct || stripeProduct.prices.length === 0) {
      toast({
        title: "Temporarily Unavailable",
        description: "This experience is being set up. Please try again shortly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/stripe/checkout', {
        priceId: stripeProduct.prices[0].id,
        mode: 'payment',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Music,
      title: "3 Love Songs",
      description: "Emotional progression from sweet → playful → intimate"
    },
    {
      icon: Sparkles,
      title: "Pre-written Romantic Prompts",
      description: "Just add your names — we handle the rest"
    },
    {
      icon: Image,
      title: "Matching Cover Art Set",
      description: "Beautiful, cohesive visuals for all 3 songs"
    },
    {
      icon: Heart,
      title: "Exclusive Date Night Styles",
      description: "Special voices and music styles not available with credits"
    },
    {
      icon: Link2,
      title: "One Shareable Experience Link",
      description: "Send your entire collection with a single link"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/pricing')}
          data-testid="button-back-pricing"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-6">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          
          <Badge className="mb-4 bg-rose-500 hover:bg-rose-600">
            Special Experience
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Date Night Experience
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            A romantic, ready-to-send experience — perfect for anniversaries, surprises, or "just because."
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-bold text-rose-500">$5</span>
            <span className="text-muted-foreground">one-time purchase</span>
          </div>
        </div>

        <Card className="mb-12 border-rose-200 dark:border-rose-800">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
            <CardDescription>Everything you need for the perfect romantic gesture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 border-rose-200 dark:border-rose-800">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Purchase the Experience</h3>
                  <p className="text-muted-foreground">One-time payment of $5</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Add Your Names</h3>
                  <p className="text-muted-foreground">Enter your name and your partner's name</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Generate Your Songs</h3>
                  <p className="text-muted-foreground">We create 3 personalized love songs with matching art</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">4</div>
                <div>
                  <h3 className="font-semibold">Share the Magic</h3>
                  <p className="text-muted-foreground">Send your romantic mixtape with one shareable link</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg bg-rose-500 hover:bg-rose-600"
            onClick={handlePurchase}
            disabled={loading || productsLoading}
            data-testid="button-purchase-date-night"
          >
            {loading || productsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Heart className="w-5 h-5 mr-2" />
            )}
            Create Date Night — $5
          </Button>
          <p className="text-sm text-muted-foreground">
            Secure checkout powered by Stripe
          </p>
          
          {isAuthenticated && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Already purchased?</p>
              <Button 
                variant="outline"
                onClick={() => setLocation('/experience/date-night/create')}
                data-testid="button-start-creating"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Creating
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
