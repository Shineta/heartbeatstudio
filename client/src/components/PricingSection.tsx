import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CreditCard, Crown, Loader2, Heart, Cake, Church, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface StripeProduct {
  id: string;
  name: string;
  prices: {
    id: string;
    unit_amount: number;
    recurring?: { interval: string };
  }[];
}

const planConfig = [
  {
    name: "Free Plan",
    stripeName: null,
    price: "$0",
    period: "forever",
    description: "Get started with AI-powered celebrations",
    icon: Sparkles,
    features: [
      "3 song generations",
      "Email authentication required",
      "Basic AI voices & styles",
      "Share via link",
    ],
    cta: "Start Free",
    highlighted: false,
    badge: null,
    mode: null,
  },
  {
    name: "Credit Pack",
    stripeName: "Credit Pack",
    price: "$4.99",
    period: "one-time",
    description: "Perfect for a special occasion",
    icon: CreditCard,
    features: [
      "5 songs + cover art",
      "Premium AI voices",
      "High-quality audio",
      "Shareable links",
      "Never expires",
    ],
    cta: "Buy Credits",
    highlighted: false,
    badge: "Best Value",
    mode: "payment",
  },
  {
    name: "Subscription",
    stripeName: "Subscription",
    price: "$10",
    period: "per month",
    description: "For those who celebrate often",
    icon: Crown,
    features: [
      "15 songs per month",
      "All premium voices & styles",
      "Priority generation",
      "Email & SMS delivery",
      "Advanced scheduling",
      "Cancel anytime",
    ],
    cta: "Subscribe Now",
    highlighted: true,
    badge: "Most Popular",
    mode: "subscription",
  },
];

const kitConfig = [
  {
    name: "Date Night Kit",
    stripeName: "Date Night Kit",
    price: "$5",
    description: "3 love songs, 3 covers",
    icon: Heart,
    theme: "love",
    mode: "payment",
  },
  {
    name: "Birthday Blast",
    stripeName: "Birthday Blast",
    price: "$2.50",
    description: "1 birthday song, 1 visual",
    icon: Cake,
    theme: "birthday",
    mode: "payment",
  },
  {
    name: "Gospel Greeting",
    stripeName: "Gospel Greeting",
    price: "$3",
    description: "2 spiritual messages, 2 images",
    icon: Church,
    theme: "spiritual",
    mode: "payment",
  },
  {
    name: "Classroom Cheers",
    stripeName: "Classroom Cheers",
    price: "$5",
    description: "5 group songs for teachers/students",
    icon: GraduationCap,
    theme: "education",
    mode: "payment",
  },
];

export default function PricingSection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: productsData } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products'],
  });

  const handleSelectPlan = async (plan: typeof planConfig[0]) => {
    if (plan.name === "Free Plan") {
      setLocation('/auth');
      return;
    }

    if (!plan.stripeName || !plan.mode) {
      toast({
        title: "Coming Soon",
        description: "This plan is not yet available.",
      });
      return;
    }

    const stripeProduct = productsData?.products?.find(
      p => p.name === plan.stripeName
    );

    if (!stripeProduct || stripeProduct.prices.length === 0) {
      toast({
        title: "Temporarily Unavailable",
        description: "This plan is being set up. Please try again shortly.",
        variant: "destructive",
      });
      return;
    }

    const priceId = stripeProduct.prices[0].id;

    setLoadingPlan(plan.name);
    try {
      const response = await apiRequest('POST', '/api/stripe/checkout', {
        priceId,
        mode: plan.mode,
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        toast({
          title: "Sign in required",
          description: "Please sign in to purchase a plan.",
        });
        setLocation('/auth');
      } else {
        toast({
          title: "Checkout Failed",
          description: error.message || "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectKit = async (kit: typeof kitConfig[0]) => {
    const stripeProduct = productsData?.products?.find(
      p => p.name === kit.stripeName
    );

    if (!stripeProduct || stripeProduct.prices.length === 0) {
      toast({
        title: "Temporarily Unavailable",
        description: "This kit is being set up. Please try again shortly.",
        variant: "destructive",
      });
      return;
    }

    const priceId = stripeProduct.prices[0].id;

    setLoadingPlan(kit.name);
    try {
      const response = await apiRequest('POST', '/api/stripe/checkout', {
        priceId,
        mode: kit.mode,
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        toast({
          title: "Sign in required",
          description: "Please sign in to purchase a kit.",
        });
        setLocation('/auth');
      } else {
        toast({
          title: "Checkout Failed",
          description: error.message || "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your celebration style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {planConfig.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''} hover-elevate flex flex-col`}
              data-testid={`card-pricing-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {plan.badge && (
                <Badge 
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    plan.highlighted 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="text-center pt-6">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <plan.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={loadingPlan === plan.name}
                  onClick={() => handleSelectPlan(plan)}
                  data-testid={`button-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include AI-generated cover art and shareable links. No hidden fees.
        </p>

        {/* Themed Kits Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Themed Kits & Bundles
            </h3>
            <p className="text-muted-foreground">
              Pre-packaged celebrations for every occasion
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {kitConfig.map((kit) => (
              <Card 
                key={kit.name} 
                className="hover-elevate flex flex-col"
                data-testid={`card-kit-${kit.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <kit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {kit.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{kit.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center pb-2">
                  <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {kit.price}
                  </span>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    className="w-full"
                    variant="outline"
                    size="sm"
                    disabled={loadingPlan === kit.name}
                    onClick={() => handleSelectKit(kit)}
                    data-testid={`button-buy-${kit.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {loadingPlan === kit.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Buy Kit"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
