import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Music, ArrowLeft, Loader2, Lock, UserPlus, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

const trySongFormSchema = z.object({
  recipientName: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
  genre: z.string().min(1, "Genre is required"),
  songDetails: z.string().min(10, "Please share some details about the song (at least 10 characters)"),
});

type TrySongFormData = z.infer<typeof trySongFormSchema>;

interface DemoSong {
  title: string;
  lyrics: string;
  genre: string;
  tone: string;
  recipientName: string;
}

export default function TrySongPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [demoSong, setDemoSong] = useState<DemoSong | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const form = useForm<TrySongFormData>({
    resolver: zodResolver(trySongFormSchema),
    defaultValues: {
      recipientName: "",
      relationship: "",
      occasion: "",
      tone: "sweet",
      genre: "pop",
      songDetails: "",
    },
  });

  const generateDemoLyrics = async (data: TrySongFormData): Promise<DemoSong> => {
    const response = await fetch('/api/try/generate-lyrics', {
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
      lyrics: result.lyrics,
      genre: data.genre,
      tone: data.tone,
      recipientName: data.recipientName,
    };
  };

  const onSubmit = async (data: TrySongFormData) => {
    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const result = await generateDemoLyrics(data);
      setDemoSong(result);
      setProgress(100);
      
      localStorage.setItem('heartbeat_try_song', JSON.stringify({
        formData: data,
        song: result,
        timestamp: Date.now(),
      }));
      
      toast({
        title: "Preview Ready!",
        description: "Here's a preview of your personalized song lyrics.",
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
    localStorage.setItem('heartbeat_pending_action', 'create_song');
    setLocation('/auth?returnTo=/create?type=song');
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('heartbeat_pending_action', 'create_song');
    setLocation('/auth?mode=login&returnTo=/create?type=song');
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
              <Music className="w-8 h-8 text-primary" />
              Try Song Creator
            </h1>
            <p className="text-muted-foreground">
              Experience the magic - no account needed!
            </p>
          </div>
        </div>

        {!demoSong ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Create Your Song Preview
              </CardTitle>
              <CardDescription>
                Tell us about your loved one and we'll generate personalized lyrics for you.
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
                        <FormLabel>Who is this song for? <span className="text-destructive">*</span></FormLabel>
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

                  <div className="grid grid-cols-2 gap-4">
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
                              <SelectItem value="upbeat">Upbeat</SelectItem>
                              <SelectItem value="playful">Playful</SelectItem>
                              <SelectItem value="inspirational">Inspirational</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genre <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-genre">
                                <SelectValue placeholder="Select genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pop">Pop</SelectItem>
                              <SelectItem value="r&b">R&B</SelectItem>
                              <SelectItem value="soul">Soul</SelectItem>
                              <SelectItem value="gospel">Gospel</SelectItem>
                              <SelectItem value="country">Country</SelectItem>
                              <SelectItem value="acoustic">Acoustic</SelectItem>
                              <SelectItem value="jazz">Jazz</SelectItem>
                              <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="songDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What should the song be about? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share memories, inside jokes, personality traits, or what makes them special..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-song-details"
                          />
                        </FormControl>
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
                        Generate Song Preview
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Creating your personalized lyrics...
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
                    <Music className="w-5 h-5 text-primary" />
                    {demoSong.title}
                  </CardTitle>
                  <CardDescription>
                    A {demoSong.tone} {demoSong.genre} song for {demoSong.recipientName}
                  </CardDescription>
                </div>
                <div className="bg-primary/10 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-primary">Preview</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3 text-lg">Your Personalized Lyrics</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {demoSong.lyrics}
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Ready to bring this to life?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign up to generate the full audio with vocals, music, and cover art. 
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
                data-testid="button-save-song"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up to Create Full Song
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setDemoSong(null)}
                data-testid="button-try-again"
              >
                Try Another Song
              </Button>
            </CardFooter>
          </Card>
        )}

        <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Ready to Create Your Song?
              </DialogTitle>
              <DialogDescription>
                Sign up for free to generate your full song with audio, vocals, and cover art. 
                Your lyrics preview will be saved!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">What you'll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full song with vocals and music</li>
                  <li>• Personalized cover art</li>
                  <li>• Shareable link to send to your loved one</li>
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
