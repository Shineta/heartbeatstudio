import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Mail, ArrowLeft, Loader2, Lock, UserPlus, LogIn, Heart, Image, Music, Calendar, Share2, Play, Pause, Volume2 } from "lucide-react";
import sampleCardImage from "@assets/stock_images/woman_smiling_warm_p_3e16e3ca.jpg";
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
            {/* Hero Message */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Here's What Your Card Could Look Like!
              </h2>
              <p className="text-muted-foreground">
                A personalized card created just for {demoCard.recipientName}
              </p>
            </div>

            {/* Full Card Preview - Like SharePage */}
            <Card className="overflow-hidden shadow-xl">
              {/* Sample Image */}
              <div className="w-full relative">
                <img 
                  src={sampleCardImage} 
                  alt="Sample card illustration"
                  className="w-full h-auto"
                />
                {/* Personalization overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                  <div className="p-4 w-full">
                    <div className="flex items-center gap-2 text-white/90">
                      <Image className="w-4 h-4" />
                      <span className="text-sm font-medium">Sample Image - Sign up to personalize!</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-1" data-testid="text-card-title">
                      {demoCard.title}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {demoCard.tone}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Sample Song Section */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">A Song For You</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Sample: "Shine Through Every Mile"</p>
                  
                  {/* Fake audio player UI */}
                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border">
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-primary rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0:00</span>
                          <span>3:45</span>
                        </div>
                      </div>
                      <Volume2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {/* Personalize overlay */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t text-primary">
                      <Music className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign up to add your own personalized song!</span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Message</h3>
                  <div 
                    className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap"
                    data-testid="text-message"
                  >
                    {demoCard.message}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalization CTA */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Make It Truly Personal</h3>
                    <p className="text-muted-foreground">
                      Sign up to customize your card with personalized AI-generated images and songs that match your message perfectly.
                    </p>
                  </div>
                  
                  {/* Features list */}
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                        <Image className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-sm">Custom Images</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Music className="w-4 h-4 text-violet-600" />
                      </div>
                      <span className="text-sm">Personal Songs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm">Schedule Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm">Easy Sharing</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-primary font-medium mb-4">
                      Start with 3 free credits!
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button 
                        size="lg"
                        className="w-full" 
                        onClick={handleSaveOrSend}
                        data-testid="button-save-card"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up to Personalize Your Card
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
                </div>
              </CardContent>
            </Card>
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
