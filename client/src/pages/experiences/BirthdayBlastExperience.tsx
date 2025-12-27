import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cake, Check, Sparkles, Music, Image, Link2, ArrowLeft, Loader2 } from "lucide-react";
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

export default function BirthdayBlastExperience() {
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

    const stripeProduct = productsData?.products?.find(p => p.name === "Birthday Blast");
    
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
      title: "1 Personalized Birthday Song",
      description: "A custom song with their name and your special message"
    },
    {
      icon: Image,
      title: "1 Themed Birthday Visual",
      description: "A festive cover art to match the celebration"
    },
    {
      icon: Sparkles,
      title: "Pre-filled Celebratory Prompts",
      description: "Just add the birthday person's name and hit generate"
    },
    {
      icon: Link2,
      title: "Shareable Link",
      description: "Send your birthday song instantly via text, email, or social"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
            <Cake className="w-10 h-10 text-amber-500" />
          </div>
          
          <Badge className="mb-4 bg-amber-500 hover:bg-amber-600">
            Special Experience
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Birthday Blast Experience
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            A fast, joyful birthday moment that feels personal — even last minute.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-bold text-amber-500">$2.50</span>
            <span className="text-muted-foreground">one-time purchase</span>
          </div>
        </div>

        <Card className="mb-12 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
            <CardDescription>Everything you need for a memorable birthday surprise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-amber-500" />
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

        <Card className="mb-12 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Purchase the Experience</h3>
                  <p className="text-muted-foreground">Quick payment of just $2.50</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Add Their Name</h3>
                  <p className="text-muted-foreground">Enter the birthday person's name</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Generate the Song</h3>
                  <p className="text-muted-foreground">We create a personalized birthday song with festive artwork</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">4</div>
                <div>
                  <h3 className="font-semibold">Share the Joy</h3>
                  <p className="text-muted-foreground">Send it instantly and watch them smile</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg bg-amber-500 hover:bg-amber-600"
            onClick={handlePurchase}
            disabled={loading || productsLoading}
            data-testid="button-purchase-birthday-blast"
          >
            {loading || productsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Cake className="w-5 h-5 mr-2" />
            )}
            Celebrate a Birthday — $2.50
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
