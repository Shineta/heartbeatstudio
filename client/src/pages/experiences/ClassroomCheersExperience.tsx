import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Sparkles, Music, Image, Link2, ArrowLeft, Loader2, Users } from "lucide-react";
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

export default function ClassroomCheersExperience() {
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

    const stripeProduct = productsData?.products?.find(p => p.name === "Classroom Cheers");
    
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
      title: "5 Group Songs",
      description: "Perfect for class, team, or grade level celebrations"
    },
    {
      icon: Sparkles,
      title: "School-Friendly Tones & Lyrics",
      description: "Age-appropriate, encouraging content for all ages"
    },
    {
      icon: Image,
      title: "Coordinated Classroom Visuals",
      description: "Fun, colorful artwork that matches each song"
    },
    {
      icon: Users,
      title: "Easy Sharing for Families & Classrooms",
      description: "Share with parents and students via one simple link"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
            <GraduationCap className="w-10 h-10 text-emerald-500" />
          </div>
          
          <Badge className="mb-4 bg-emerald-500 hover:bg-emerald-600">
            Special Experience
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Classroom Cheers Experience
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Encouragement and celebration for students and educators.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-bold text-emerald-500">$5</span>
            <span className="text-muted-foreground">one-time purchase</span>
          </div>
        </div>

        <Card className="mb-12 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
            <CardDescription>Everything you need to celebrate your classroom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-emerald-500" />
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

        <Card className="mb-12 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-2xl">Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <h3 className="font-semibold mb-1">Teachers</h3>
                <p className="text-sm text-muted-foreground">Motivate and celebrate your students</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <h3 className="font-semibold mb-1">Coaches</h3>
                <p className="text-sm text-muted-foreground">Pump up your team for the big game</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <h3 className="font-semibold mb-1">Parents</h3>
                <p className="text-sm text-muted-foreground">Thank teachers and celebrate the class</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <h3 className="font-semibold mb-1">School Staff</h3>
                <p className="text-sm text-muted-foreground">End-of-year celebrations and recognition</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Purchase the Experience</h3>
                  <p className="text-muted-foreground">One-time payment of $5</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Add Class or Team Details</h3>
                  <p className="text-muted-foreground">Enter class name, grade, or team name</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Generate Your Songs</h3>
                  <p className="text-muted-foreground">We create 5 encouraging songs with fun visuals</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold">4</div>
                <div>
                  <h3 className="font-semibold">Share with Everyone</h3>
                  <p className="text-muted-foreground">Send to parents, students, and staff easily</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg bg-emerald-500 hover:bg-emerald-600"
            onClick={handlePurchase}
            disabled={loading || productsLoading}
            data-testid="button-purchase-classroom-cheers"
          >
            {loading || productsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <GraduationCap className="w-5 h-5 mr-2" />
            )}
            Celebrate Your Classroom — $5
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
