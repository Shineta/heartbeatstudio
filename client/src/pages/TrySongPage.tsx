import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Music, ArrowLeft, Loader2, Lock, UserPlus, LogIn, Play, Pause, Volume2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

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
  audioUrl: string;
  genre: string;
  tone: string;
  recipientName: string;
}

export default function TrySongPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'lyrics' | 'audio' | null>(null);
  const [demoSong, setDemoSong] = useState<DemoSong | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewLimit, setPreviewLimit] = useState(0); // 50% of total duration
  const [showPreviewEnded, setShowPreviewEnded] = useState(false);

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

  // Audio player effects - re-run when demoSong changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !demoSong) return;

    const handleLoadedMetadata = () => {
      console.log('[Audio] Metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setPreviewLimit(audio.duration * 0.5); // 50% preview limit
    };

    const handleDurationChange = () => {
      // Backup event for duration
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        console.log('[Audio] Duration changed:', audio.duration);
        setDuration(audio.duration);
        setPreviewLimit(audio.duration * 0.5);
      }
    };

    const handleCanPlay = () => {
      // Another backup to get duration
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0 && duration === 0) {
        console.log('[Audio] CanPlay - duration:', audio.duration);
        setDuration(audio.duration);
        setPreviewLimit(audio.duration * 0.5);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Calculate 50% limit dynamically in case previewLimit wasn't set
      const limit = audio.duration > 0 ? audio.duration * 0.5 : 0;
      
      // Stop at 50% for preview
      if (limit > 0 && audio.currentTime >= limit) {
        audio.pause();
        setIsPlaying(false);
        setShowPreviewEnded(true);
        // Prevent playing past the limit
        audio.currentTime = limit;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Try to load the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [demoSong, duration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Reset if we hit the preview limit
      if (currentTime >= previewLimit && previewLimit > 0) {
        audio.currentTime = 0;
        setShowPreviewEnded(false);
      }
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateDemoSong = async (data: TrySongFormData): Promise<DemoSong> => {
    const response = await fetch('/api/try/generate-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate song');
    }

    const result = await response.json();
    return {
      title: result.title,
      lyrics: result.lyrics,
      audioUrl: result.audioUrl,
      genre: data.genre,
      tone: data.tone,
      recipientName: data.recipientName,
    };
  };

  const onSubmit = async (data: TrySongFormData) => {
    setIsGenerating(true);
    setProgress(0);
    setGenerationStage('lyrics');

    // Slower progress for actual song generation (takes longer)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 45 && generationStage === 'lyrics') return prev;
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);

    try {
      // Update stage for UI
      setTimeout(() => {
        setGenerationStage('audio');
        setProgress(50);
      }, 10000);

      const result = await generateDemoSong(data);
      setDemoSong(result);
      setProgress(100);
      setShowPreviewEnded(false);
      setCurrentTime(0);
      
      localStorage.setItem('heartbeat_try_song', JSON.stringify({
        formData: data,
        song: result,
        timestamp: Date.now(),
      }));
      
      toast({
        title: "Your Song is Ready!",
        description: "Listen to a preview of your personalized song.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate song. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationStage(null);
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
                            <SelectItem value="get-well">Get Well</SelectItem>
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
                        {generationStage === 'lyrics' 
                          ? 'Creating your personalized lyrics...' 
                          : 'Generating your song with vocals and music...'}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        This may take 1-2 minutes
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
                  <span className="text-sm font-medium text-primary">50% Preview</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audio Player */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border">
                <audio ref={audioRef} src={demoSong.audioUrl} preload="metadata" />
                
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={togglePlayPause}
                    className="h-14 w-14 rounded-full"
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{demoSong.title}</span>
                    </div>
                    
                    {/* Progress bar showing preview limit */}
                    <div className="relative">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        {/* Calculate progress: current time as % of preview limit (50% of total) */}
                        <div 
                          className="h-full bg-primary transition-all duration-100"
                          style={{ 
                            width: duration > 0 
                              ? `${Math.min((currentTime / (duration * 0.5)) * 100, 100)}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                      {/* Visual indicator showing the grayed-out locked portion */}
                      <div 
                        className="absolute top-0 h-2 bg-muted-foreground/30 rounded-r-full"
                        style={{ 
                          left: '50%',
                          width: '50%'
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>
                        {duration > 0 
                          ? `Preview: ${formatTime(duration * 0.5)} / Full: ${formatTime(duration)}`
                          : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview ended message */}
                {showPreviewEnded && (
                  <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-3 border border-primary/20">
                    <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">You've heard half the song!</p>
                      <p className="text-xs text-muted-foreground">Sign up to hear the full version</p>
                    </div>
                    <Button size="sm" onClick={handleSaveOrSend} data-testid="button-unlock-full">
                      Unlock Full Song
                    </Button>
                  </div>
                )}
              </div>

              {/* Lyrics section - collapsible */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover-elevate">
                    <span className="font-semibold">View Lyrics</span>
                    <span className="text-muted-foreground text-sm group-open:hidden">Click to expand</span>
                    <span className="text-muted-foreground text-sm hidden group-open:inline">Click to collapse</span>
                  </div>
                </summary>
                <div className="bg-muted/30 rounded-lg p-4 mt-2 max-h-60 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                    {demoSong.lyrics}
                  </div>
                </div>
              </details>

              {/* Sign up prompt */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Love what you hear?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign up to get the full song, download it, and share it with your loved one. 
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
                Sign Up for Full Song
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setDemoSong(null);
                  setShowPreviewEnded(false);
                  setCurrentTime(0);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }}
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
                Unlock the Full Song
              </DialogTitle>
              <DialogDescription>
                You've heard half of "{demoSong?.title}" - sign up to unlock the complete song!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">What you'll unlock:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full-length song (you've only heard 50%)</li>
                  <li>• Personalized cover art</li>
                  <li>• Download and share with your loved one</li>
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
