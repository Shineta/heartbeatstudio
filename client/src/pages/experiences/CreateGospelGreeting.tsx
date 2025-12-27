import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Church, Music, Sparkles, Loader2, Play, Pause, Share2, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedSong {
  title: string;
  audioUrl: string;
  coverUrl: string;
  theme: string;
}

// Poll for creation completion
async function pollForCompletion(creationId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await fetch(`/api/creations/${creationId}`, { credentials: 'include' });
    if (!response.ok) continue;
    const creation = await response.json();
    if (creation.status === 'ready') return creation;
    if (creation.status === 'failed') throw new Error('Song generation failed');
  }
  throw new Error('Generation timed out');
}

export default function CreateGospelGreeting() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("encouragement");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [songs, setSongs] = useState<GeneratedSong[]>([]);
  const [shareLink, setShareLink] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (idx: number, audioUrl: string) => {
    if (!audioUrl) {
      toast({
        title: "Audio Not Available",
        description: "This song's audio is still processing.",
        variant: "destructive",
      });
      return;
    }

    if (playingIndex === idx) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      audioRef.current?.pause();
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
        toast({
          title: "Playback Error",
          description: "Unable to play the audio. Please try again.",
          variant: "destructive",
        });
      });
      audioRef.current.onended = () => setPlayingIndex(null);
      setPlayingIndex(idx);
    }
  };

  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const themes = [
    { id: "faith", label: "Faith & Trust" },
    { id: "hope", label: "Hope & Strength" },
  ];

  const occasions = [
    { value: "encouragement", label: "Encouragement" },
    { value: "healing", label: "Healing & Recovery" },
    { value: "celebration", label: "Celebration" },
    { value: "comfort", label: "Comfort & Peace" },
    { value: "gratitude", label: "Gratitude & Thanks" },
  ];

  const handleGenerate = async () => {
    if (!recipientName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the recipient's name.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCurrentStep(1);

    try {
      for (let i = 0; i < 2; i++) {
        setCurrentStep(i + 1);
        
        const response = await apiRequest('POST', '/api/creations', {
          type: 'song',
          recipientName: recipientName,
          occasion: occasion,
          tone: 'spiritual',
          genre: 'gospel',
          voiceType: 'soulful',
          customMessage: `A ${themes[i].label.toLowerCase()} gospel message for ${recipientName}`,
        });
        
        const initialCreation = await response.json();
        
        // Poll for completion
        const completedCreation = await pollForCompletion(initialCreation.id);
        
        setSongs(prev => [...prev, {
          title: completedCreation.title || `${themes[i].label} Gospel Song`,
          audioUrl: completedCreation.mediaUrl || '',
          coverUrl: completedCreation.imageUrl || '',
          theme: themes[i].label,
        }]);
      }

      setCurrentStep(3);
      setShareLink(`${window.location.origin}/share/gospel-${Date.now()}`);
      
      toast({
        title: "Gospel Greeting Created!",
        description: "Your uplifting messages are ready to share.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setCurrentStep(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link Copied!",
      description: "Share this blessing with your loved one.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Church className="w-8 h-8 text-purple-500" />
          </div>
          <Badge className="mb-2 bg-purple-500">Gospel Greeting Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Your Gospel Greeting
          </h1>
          <p className="text-muted-foreground mt-2">2 uplifting songs with soulful vocals</p>
        </div>

        {currentStep === 0 && (
          <Card className="max-w-xl mx-auto border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Enter Details
              </CardTitle>
              <CardDescription>Create a spiritually uplifting message for someone special</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient's Name</Label>
                <Input
                  id="recipientName"
                  placeholder="Enter their name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  data-testid="input-recipient-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger data-testid="select-occasion">
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((occ) => (
                      <SelectItem key={occ.value} value={occ.value}>
                        {occ.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Your greeting will include:</p>
                <div className="space-y-2">
                  {themes.map((theme, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{theme.label}</span>
                      <span className="text-muted-foreground">gospel message</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={handleGenerate}
                disabled={generating}
                data-testid="button-generate-songs"
              >
                <Church className="w-4 h-4 mr-2" />
                Generate Gospel Greeting
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card className="max-w-xl mx-auto border-purple-200 dark:border-purple-800">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creating Your Gospel Greeting</h3>
              <p className="text-muted-foreground mb-6">
                Generating message {currentStep} of 2: {themes[currentStep - 1]?.label || ''}
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step < currentStep ? 'bg-purple-500' : 
                      step === currentStep ? 'bg-purple-500 animate-pulse' : 
                      'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && songs.length > 0 && (
          <div className="space-y-6">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Gospel Greeting Ready!</CardTitle>
                <CardDescription>Share this blessing with {recipientName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30"
                    >
                      <div className="w-16 h-16 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Church className="w-8 h-8 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-muted-foreground">{song.theme}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handlePlayPause(idx, song.audioUrl)}
                        data-testid={`button-play-${idx}`}
                      >
                        {playingIndex === idx ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input 
                      value={shareLink} 
                      readOnly 
                      className="bg-muted"
                      data-testid="input-share-link"
                    />
                  </div>
                  <Button onClick={handleShare} className="bg-purple-500 hover:bg-purple-600" data-testid="button-copy-link">
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/dashboard')}
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
