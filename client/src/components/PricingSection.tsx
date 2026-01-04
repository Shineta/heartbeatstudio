import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CreditCard, Crown, Loader2, Heart, Cake, Church, GraduationCap, Music, Image, Link2, AlertCircle, Clock, Lightbulb, RefreshCw } from "lucide-react";
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

interface PlanFeature {
  text: string;
  included: boolean;
  warning?: boolean;
}

interface CreditPlan {
  name: string;
  stripeName: string | null;
  price: string;
  period: string;
  description: string;
  icon: typeof Sparkles;
  features: PlanFeature[];
  cta: string;
  highlighted: boolean;
  badge: string | null;
  mode: string | null;
}

const creditPlans: CreditPlan[] = [
  {
    name: "Free Plan",
    stripeName: null,
    price: "$0",
    period: "forever",
    description: "Try it out and explore the basics",
    icon: Sparkles,
    features: [
      { text: "6 credits (1 credit = 1 song or card)", included: true },
      { text: "Standard AI voices & styles", included: true },
      { text: "AI-generated cover art", included: true },
      { text: "Shareable link", included: true },
      { text: "Email sign-in required", included: false, warning: true },
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
    description: "Perfect for a single occasion",
    icon: CreditCard,
    features: [
      { text: "5 credits (songs or cards)", included: true },
      { text: "Premium AI voices & styles", included: true },
      { text: "Higher-quality audio", included: true },
      { text: "AI cover art + shareable links", included: true },
      { text: "Credits never expire", included: true },
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
    description: "For people who celebrate often",
    icon: Crown,
    features: [
      { text: "15 credits every month", included: true },
      { text: "All premium voices & styles", included: true },
      { text: "Priority generation", included: true },
      { text: "Email & SMS delivery", included: true },
      { text: "Schedule messages to send later", included: true },
      { text: "Cancel anytime", included: true },
    ],
    cta: "Subscribe Now",
    highlighted: true,
    badge: "Most Popular",
    mode: "subscription",
  },
];

const experiences = [
  {
    name: "Date Night Experience",
    stripeName: "Date Night Kit",
    price: "$5",
    emoji: "heart",
    tagline: "A romantic, ready-to-send experience — perfect for anniversaries, surprises, or \"just because.\"",
    icon: Heart,
    color: "from-rose-500/20 to-pink-500/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    includes: [
      "3 love songs with emotional progression (sweet → playful → intimate)",
      "Pre-written romantic prompts (just add names)",
      "Matching cover art set",
      "Exclusive Date Night styles not available with credits",
      "One shareable experience link",
    ],
    cta: "Create Date Night",
    mode: "payment",
    route: "/experience/date-night",
  },
  {
    name: "Birthday Blast Experience",
    stripeName: "Birthday Blast",
    price: "$5",
    emoji: "party",
    tagline: "A complete birthday celebration with 5 unique songs — from classic to party anthems.",
    icon: Cake,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    includes: [
      "5 personalized birthday songs (Classic, Dance, Heartfelt, Fun, Anthem)",
      "5 themed birthday visuals",
      "Pre-filled celebratory prompts",
      "Shareable experience link",
    ],
    cta: "Celebrate a Birthday",
    mode: "payment",
    route: "/experience/birthday-blast",
  },
  {
    name: "Gospel Greeting Experience",
    stripeName: "Gospel Greeting",
    price: "$3",
    emoji: "pray",
    tagline: "A spiritually grounded message rooted in warmth, encouragement, and faith.",
    icon: Church,
    color: "from-purple-500/20 to-indigo-500/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    includes: [
      "2 gospel-inspired audio messages",
      "Soulful, church-style vocal delivery",
      "2 uplifting visuals",
      "Shareable experience link",
    ],
    cta: "Send a Gospel Greeting",
    mode: "payment",
    route: "/experience/gospel-greeting",
  },
  {
    name: "Classroom Cheers Experience",
    stripeName: "Classroom Cheers",
    price: "$5",
    emoji: "grad",
    tagline: "Encouragement and celebration for students and educators.",
    icon: GraduationCap,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    includes: [
      "5 group songs (class, team, or grade level)",
      "School-friendly tones & lyrics",
      "Coordinated classroom visuals",
      "Easy sharing for families & classrooms",
    ],
    cta: "Celebrate Your Classroom",
    mode: "payment",
    route: "/experience/classroom-cheers",
  },
];

export default function PricingSection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ['/api/stripe/products'],
    retry: 3,
    staleTime: 1000 * 60 * 5,
  });

  const handleSelectPlan = async (plan: typeof creditPlans[0]) => {
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

    if (productsLoading) {
      toast({
        title: "Loading",
        description: "Please wait while we load pricing information.",
      });
      return;
    }

    const stripeProduct = productsData?.products?.find(
      p => p.name === plan.stripeName
    );

    if (!stripeProduct || stripeProduct.prices.length === 0) {
      console.error('[Pricing] Product not found:', plan.stripeName, 'Available:', productsData?.products?.map(p => p.name));
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

  const handleSelectExperience = (experience: typeof experiences[0]) => {
    setLocation(experience.route);
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Simple Pricing. Meaningful Moments.
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Create songs, messages, and visuals that celebrate the people you love — whether you want full creative control or a ready-made experience.
          </p>
        </div>

        {/* Choose How You Want to Create */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Music className="w-5 h-5" />
            <span className="font-semibold">Choose How You Want to Create</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">1</span>
                  Create Freely with Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Best if you know what you want and like to customize.</p>
              </CardContent>
            </Card>
            
            <Card className="text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">2</span>
                  Choose a Special Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Best if you want something beautiful, fast, and emotionally guided.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit-Based Plans Section */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Credit-Based Plans
            </h2>
            <p className="text-muted-foreground">For creators who want flexibility</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPlans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative flex flex-col ${plan.highlighted ? 'ring-2 ring-primary shadow-lg' : ''}`}
                data-testid={`card-plan-${plan.name}`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">· {plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.warning ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <span className={feature.warning ? 'text-muted-foreground' : ''}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loadingPlan === plan.name || (plan.stripeName !== null && productsLoading)}
                    data-testid={`button-plan-${plan.name}`}
                  >
                    {loadingPlan === plan.name ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (plan.stripeName !== null && productsLoading) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* How Credits Work */}
          <div className="mt-8 text-center">
            <Card className="inline-block px-8 py-4 bg-muted/50">
              <p className="text-lg font-medium">
                <span className="text-primary font-bold">How Credits Work:</span>{' '}
                1 credit = 1 song or 1 card. Every creation includes cover art and a shareable link.
              </p>
            </Card>
          </div>
        </div>

        {/* Special Experiences Section */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              Special Experiences
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Themed Kits
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Done-for-you moments — no writing, no guessing. These aren't just songs. They're guided experiences designed for specific moments in life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp) => (
              <Card 
                key={exp.name}
                className={`relative overflow-hidden bg-gradient-to-br ${exp.color} ${exp.borderColor} border-2`}
                data-testid={`card-experience-${exp.name}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                        <exp.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-xl">{exp.name}</CardTitle>
                    </div>
                    <span className="text-2xl font-bold">{exp.price}</span>
                  </div>
                  <CardDescription className="text-foreground/80">{exp.tagline}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm font-semibold mb-3 text-foreground/70">Includes:</p>
                  <ul className="space-y-2">
                    {exp.includes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleSelectExperience(exp)}
                    data-testid={`button-experience-${exp.name}`}
                  >
                    {exp.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Credits vs Special Experiences
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x">
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Credits
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Full creative control
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Write your own prompts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Flexible styles
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Best for creators
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Songs only
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-primary/5">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Special Experiences
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Done-for-you
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Prompts included
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Exclusive themed styles
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Best for busy or emotional moments
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Songs + visuals + structure
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Not Sure What to Choose */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Not Sure What to Choose?
            </h2>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">"I want to customize everything"</p>
                  <p className="text-sm text-muted-foreground">→ Credits</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">"I'm short on time"</p>
                  <p className="text-sm text-muted-foreground">→ Special Experience</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">"I want this to feel special"</p>
                  <p className="text-sm text-muted-foreground">→ Special Experience</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">"I'll use this often"</p>
                  <p className="text-sm text-muted-foreground">→ Subscription</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Every Plan Includes */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Every Plan Includes
          </h2>
          
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">AI-generated cover art</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Shareable links</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">No hidden fees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
