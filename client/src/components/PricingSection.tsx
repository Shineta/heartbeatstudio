import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CreditCard, Crown } from "lucide-react";

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    period: "forever",
    description: "Get started with AI-powered celebrations",
    icon: Sparkles,
    features: [
      "3-5 song generations",
      "Email authentication required",
      "Basic AI voices & styles",
      "Share via link",
    ],
    cta: "Start Free",
    highlighted: false,
    badge: null,
  },
  {
    name: "Credit Pack",
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
  },
  {
    name: "Subscription",
    price: "$10",
    period: "per month",
    description: "For those who celebrate often",
    icon: Crown,
    features: [
      "25 songs per month",
      "All premium voices & styles",
      "Priority generation",
      "Email & SMS delivery",
      "Advanced scheduling",
      "Cancel anytime",
    ],
    cta: "Subscribe Now",
    highlighted: true,
    badge: "Most Popular",
  },
];

export default function PricingSection() {
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
          {plans.map((plan) => (
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
                      : plan.badge === 'Future' 
                        ? 'bg-muted text-muted-foreground' 
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
                  {plan.period !== "coming soon" && (
                    <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
                  )}
                  {plan.period === "coming soon" && (
                    <p className="text-muted-foreground text-xs mt-1">{plan.period}</p>
                  )}
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
                  disabled={plan.period === "coming soon"}
                  onClick={() => console.log(`Selected ${plan.name} plan`)}
                  data-testid={`button-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include AI-generated cover art and shareable links. No hidden fees.
        </p>
      </div>
    </section>
  );
}
