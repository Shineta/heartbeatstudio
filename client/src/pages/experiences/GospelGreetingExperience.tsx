import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Church, Sparkles, Music, Image, Link2, ArrowLeft, Loader2 } from "lucide-react";
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

export default function GospelGreetingExperience() {
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
      setLocation('/auth?returnTo=/experience/gospel-greeting');
      return;
    }

    const stripeProduct = productsData?.products?.find(p => p.name === "Gospel Greeting");
    
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
      title: "2 Gospel-Inspired Audio Messages",
      description: "Uplifting songs rooted in faith and encouragement"
    },
    {
      icon: Sparkles,
      title: "Soulful, Church-Style Vocal Delivery",
      description: "Warm, powerful vocals inspired by gospel tradition"
    },
    {
      icon: Image,
      title: "2 Uplifting Visuals",
      description: "Beautiful artwork that complements the spiritual message"
    },
    {
      icon: Link2,
      title: "Shareable Experience Link",
      description: "Share your gospel greeting with loved ones easily"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-6">
            <Church className="w-10 h-10 text-purple-500" />
          </div>
          
          <Badge className="mb-4 bg-purple-500 hover:bg-purple-600">
            Special Experience
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Gospel Greeting Experience
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            A spiritually grounded message rooted in warmth, encouragement, and faith.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-bold text-purple-500">$3</span>
            <span className="text-muted-foreground">one-time purchase</span>
          </div>
        </div>

        <Card className="mb-12 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
            <CardDescription>Everything you need to share faith and encouragement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-purple-500" />
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

        <Card className="mb-12 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Purchase the Experience</h3>
                  <p className="text-muted-foreground">One-time payment of $3</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Add the Recipient's Name</h3>
                  <p className="text-muted-foreground">Personalize your gospel greeting</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Generate Your Messages</h3>
                  <p className="text-muted-foreground">We create 2 soulful songs with beautiful visuals</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 font-bold">4</div>
                <div>
                  <h3 className="font-semibold">Share the Blessing</h3>
                  <p className="text-muted-foreground">Send your uplifting message to inspire and encourage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg bg-purple-500 hover:bg-purple-600"
            onClick={handlePurchase}
            disabled={loading || productsLoading}
            data-testid="button-purchase-gospel-greeting"
          >
            {loading || productsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Church className="w-5 h-5 mr-2" />
            )}
            Send a Gospel Greeting — $3
          </Button>
          <p className="text-sm text-muted-foreground">
            Secure checkout powered by Stripe
          </p>
          
          {isAuthenticated && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Already purchased?</p>
              <Button 
                variant="outline"
                onClick={() => setLocation('/experience/gospel-greeting/create')}
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
