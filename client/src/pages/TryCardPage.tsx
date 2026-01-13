import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Mail, ArrowLeft, Loader2, Lock, UserPlus, LogIn, Heart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

const tryCardFormSchema = z.object({
  recipientName: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
});

type TryCardFormData = z.infer<typeof tryCardFormSchema>;

interface DemoCard {
  title: string;
  message: string;
  occasion: string;
  tone: string;
  recipientName: string;
}

export default function TryCardPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [demoCard, setDemoCard] = useState<DemoCard | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const form = useForm<TryCardFormData>({
    resolver: zodResolver(tryCardFormSchema),
    defaultValues: {
      recipientName: "",
      relationship: "",
      occasion: "",
      tone: "sweet",
    },
  });

  const generateDemoCard = async (data: TryCardFormData): Promise<DemoCard> => {
    const response = await fetch('/api/try/generate-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to generate preview');
    }

    const result = await response.json();
    return {
      title: result.title,
      message: result.message,
      occasion: data.occasion,
      tone: data.tone,
      recipientName: data.recipientName,
    };
  };

  const onSubmit = async (data: TryCardFormData) => {
    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 300);

    try {
      const result = await generateDemoCard(data);
      setDemoCard(result);
      setProgress(100);
      
      localStorage.setItem('heartbeat_try_card', JSON.stringify({
        formData: data,
        card: result,
        timestamp: Date.now(),
      }));
      
      toast({
        title: "Preview Ready!",
        description: "Here's a preview of your personalized card.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleSaveOrSend = () => {
    setShowSignupModal(true);
  };

  const handleSignupRedirect = () => {
    localStorage.setItem('heartbeat_pending_action', 'create_card');
    setLocation('/auth?returnTo=/create?type=card');
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('heartbeat_pending_action', 'create_card');
    setLocation('/auth?mode=login&returnTo=/create?type=card');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <Mail className="w-8 h-8 text-primary" />
              Try Card Maker
            </h1>
            <p className="text-muted-foreground">
              Experience the magic - no account needed!
            </p>
          </div>
        </div>

        {!demoCard ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Create Your Card Preview
              </CardTitle>
              <CardDescription>
                Tell us about your loved one and we'll generate a personalized message for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Who is this card for? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mom, Dad, Sarah" {...field} data-testid="input-recipient-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your relationship <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-relationship">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="father">Father</SelectItem>
                            <SelectItem value="spouse">Spouse/Partner</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="grandparent">Grandparent</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occasion <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-occasion">
                              <SelectValue placeholder="Select occasion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="anniversary">Anniversary</SelectItem>
                            <SelectItem value="graduation">Graduation</SelectItem>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="thank-you">Thank You</SelectItem>
                            <SelectItem value="just-because">Just Because</SelectItem>
                            <SelectItem value="holiday">Holiday</SelectItem>
                            <SelectItem value="encouragement">Encouragement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tone">
                              <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sweet">Sweet</SelectItem>
                            <SelectItem value="romantic">Romantic</SelectItem>
                            <SelectItem value="heartfelt">Heartfelt</SelectItem>
                            <SelectItem value="funny">Funny</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isGenerating}
                    data-testid="button-generate-preview"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Card Preview
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Crafting your personalized message...
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Preview Badge */}
            <div className="flex justify-center">
              <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Card Preview
                </span>
              </div>
            </div>

            {/* The Card Preview - Greeting Card Style */}
            <div className="relative">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-rose-50/30 to-amber-50/50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-amber-950/30 rounded-2xl" />
              
              {/* Card container with shadow */}
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-primary/10 overflow-hidden">
                {/* Top decorative border */}
                <div className="h-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400" />
                
                {/* Image placeholder area */}
                <div className="relative bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-8">
                  <div className="flex flex-col items-center justify-center py-8">
                    {/* Decorative hearts */}
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-5 h-5 text-primary/40" />
                      <Heart className="w-8 h-8 text-primary fill-primary/20" />
                      <Heart className="w-5 h-5 text-primary/40" />
                    </div>
                    <div className="text-center bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-lg px-6 py-3 border border-dashed border-primary/30">
                      <Lock className="w-5 h-5 text-primary/60 mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">
                        Custom illustration unlocked with full card
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Card content area */}
                <div className="p-8 text-center space-y-6">
                  {/* Title with decorative elements */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                      <Heart className="w-4 h-4 text-primary" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      {demoCard.title}
                    </h2>
                  </div>
                  
                  {/* Message */}
                  <div className="max-w-md mx-auto">
                    <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap" style={{ fontFamily: 'Georgia, serif' }}>
                      {demoCard.message}
                    </p>
                  </div>
                  
                  {/* Occasion tag */}
                  <div className="flex justify-center pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-sm text-primary">
                      <Mail className="w-3.5 h-3.5" />
                      {demoCard.occasion.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                {/* Bottom decorative border */}
                <div className="h-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400" />
              </div>
            </div>

            {/* Upgrade prompt */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Unlock the Full Card Experience</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Sign up to add beautiful AI-generated illustrations, attach songs, schedule delivery, and share with your loved one. Your first 3 credits are free!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs border">Custom Illustrations</span>
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs border">Attach Songs</span>
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs border">Schedule Delivery</span>
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs border">Shareable Link</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                className="w-full" 
                onClick={handleSaveOrSend}
                data-testid="button-save-card"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up to Create Full Card
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setDemoCard(null)}
                data-testid="button-try-again"
              >
                Try Another Card
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Ready to Create Your Card?
              </DialogTitle>
              <DialogDescription>
                Sign up for free to add illustrations, schedule delivery, and share your card. 
                Your message preview will be saved!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">What you'll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Beautiful illustrated card design</li>
                  <li>• Schedule delivery for special moments</li>
                  <li>• Shareable link to send via email or text</li>
                  <li>• 3 free credits to start!</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <Button className="w-full" onClick={handleSignupRedirect} data-testid="button-signup">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up Free
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLoginRedirect} data-testid="button-login">
                <LogIn className="w-4 h-4 mr-2" />
                I Already Have an Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
