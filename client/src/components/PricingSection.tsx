import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Heartbeat Studio",
    features: [
      "3 creations per month",
      "Basic AI voices & styles",
      "Instant delivery via link",
      "Standard card templates",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For those who celebrate often",
    features: [
      "Unlimited creations",
      "Premium voices & art styles",
      "Email & SMS delivery",
      "Advanced scheduling",
      "Animation templates",
      "Printable card formats",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
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
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`${plan.highlighted ? 'border-primary shadow-lg' : ''} hover-elevate`}
              data-testid={`card-pricing-${plan.name.toLowerCase()}`}
            >
              {plan.highlighted && (
                <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold rounded-t-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => console.log(`Selected ${plan.name} plan`)}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
