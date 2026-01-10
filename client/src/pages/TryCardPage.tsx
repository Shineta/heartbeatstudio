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
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    {demoCard.title}
                  </CardTitle>
                  <CardDescription>
                    A {demoCard.tone} card for {demoCard.recipientName} • {demoCard.occasion}
                  </CardDescription>
                </div>
                <div className="bg-primary/10 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-primary">Preview</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-8 mb-6 border border-primary/10">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {demoCard.title}
                  </h3>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {demoCard.message}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Want the full experience?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign up to add beautiful illustrations, schedule delivery, and share with your loved one. 
                      Your first 3 credits are free!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
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
            </CardFooter>
          </Card>
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
