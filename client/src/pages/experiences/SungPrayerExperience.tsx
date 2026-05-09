import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandHeart, Sparkles, Music, BookOpen, ArrowLeft, Loader2, Coins } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface StripeProduct {
  id: string;
  name: string;
  prices: {
    id: string;
    unit_amount: number;
  }[];
}

const CREDITS_REQUIRED = 2;

export default function SungPrayerExperience() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const typedUser = user as User | undefined;
  const [loading, setLoading] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products'],
  });
  
  const userCredits = typedUser?.songsRemaining ?? 0;
  const hasEnoughCredits = userCredits >= CREDITS_REQUIRED;

  const handleUseCredits = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a Sung Prayer.",
      });
      setLocation('/auth?returnTo=/experience/sung-prayer');
      return;
    }

    if (!hasEnoughCredits) {
      toast({
        title: "Not enough credits",
        description: `You need ${CREDITS_REQUIRED} credits to create a Sung Prayer. You have ${userCredits}.`,
        variant: "destructive",
      });
      return;
    }

    // Navigate to creation page - credits will be deducted when prayer is generated
    setLocation('/experience/sung-prayer/create');
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase this experience.",
      });
      setLocation('/auth?returnTo=/experience/sung-prayer');
      return;
    }

    const stripeProduct = productsData?.products?.find(p => p.name === "Sung Prayer");
    
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

  const prayerStructure = [
    {
      step: 1,
      title: "Thanksgiving",
      description: "Start your prayer with gratitude",
      detail: "Begin by expressing thanks and appreciation for God's blessings in your life"
    },
    {
      step: 2,
      title: "Declare God's Word",
      description: "Speak and affirm scripture",
      detail: "Proclaim the truth of God's Word over your situation and loved ones"
    },
    {
      step: 3,
      title: "Promises",
      description: "Claim biblical promises",
      detail: "Stand on the promises God has made to His children"
    },
  ];

  const features = [
    {
      icon: HandHeart,
      title: "Personalized Sung Prayer",
      description: "A unique prayer song created just for you or your loved one"
    },
    {
      icon: BookOpen,
      title: "Scripture-Based Structure",
      description: "Built on the foundation of Thanksgiving, Declaration, and Promises"
    },
    {
      icon: Music,
      title: "Beautiful Gospel Sound",
      description: "Uplifting music in gospel, soul, or worship style"
    },
    {
      icon: Sparkles,
      title: "Shareable Blessing",
      description: "Send your sung prayer to encourage and bless others"
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
            <HandHeart className="w-10 h-10 text-amber-600" />
          </div>
          
          <Badge className="mb-4 bg-amber-500 hover:bg-amber-600">
            Spiritual Experience
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Sung Prayer Experience
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a powerful, personalized sung prayer following the biblical pattern of 
            Thanksgiving, Declaration, and Promises. A beautiful way to lift up yourself 
            or a loved one in musical prayer.
          </p>
        </div>

        <Card className="mb-8 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              The Prayer Structure
            </CardTitle>
            <CardDescription>
              Your sung prayer will follow this powerful three-part biblical pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {prayerStructure.map((item) => (
                <div 
                  key={item.step}
                  className="relative p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900"
                  data-testid={`card-prayer-structure-${item.step}`}
                >
                  <div className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Part {item.step}
                  </div>
                  <h3 className="font-semibold mt-2 mb-1" data-testid={`text-prayer-step-title-${item.step}`}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
          <CardContent className="p-8 text-center">
            <div className="space-y-2 mb-6 text-sm">
              <p>1 Personalized Sung Prayer (3-part structure)</p>
              <p>Gospel, Soul, or Worship style</p>
              <p>Scripture references included</p>
              <p>Shareable link to send as a blessing</p>
            </div>

            {isAuthenticated && hasEnoughCredits ? (
              <>
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-primary" />
                    <span className="font-semibold">You have {userCredits} credits</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Use {CREDITS_REQUIRED} credits to create your Sung Prayer</p>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-600"
                  onClick={handleUseCredits}
                  data-testid="button-use-credits"
                >
                  <HandHeart className="w-4 h-4 mr-2" />
                  Create with Credits
                </Button>

                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-muted-foreground mb-2">Or purchase separately</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handlePurchase}
                    disabled={loading || productsLoading}
                    data-testid="button-purchase-sung-prayer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Buy for $7.99</>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }} data-testid="text-price">
                  $7.99
                </div>
                <p className="text-muted-foreground mb-6" data-testid="text-price-period">One-time purchase</p>

                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-600"
                  onClick={handlePurchase}
                  disabled={loading || productsLoading}
                  data-testid="button-purchase-sung-prayer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <HandHeart className="w-4 h-4 mr-2" />
                      Create Your Sung Prayer
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  Or use {CREDITS_REQUIRED} credits from your account
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
