import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Music, Sparkles, Loader2, Play, Pause, Share2, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedSong {
  title: string;
  audioUrl: string;
  coverUrl: string;
  mood: string;
}

// Poll for creation completion
async function pollForCompletion(creationId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    const response = await fetch(`/api/creations/${creationId}`, { credentials: 'include' });
    if (!response.ok) continue;
    const creation = await response.json();
    if (creation.status === 'ready') return creation;
    if (creation.status === 'failed') throw new Error('Song generation failed');
  }
  throw new Error('Generation timed out');
}

export default function CreateDateNight() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [eventInfo, setEventInfo] = useState("");
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
      // Pause current song
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      // Stop any currently playing song
      audioRef.current?.pause();
      
      // Play new song
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

  const songMoods = [
    { mood: "Sweet", description: "A tender, heartfelt love song" },
    { mood: "Playful", description: "An upbeat, fun romantic tune" },
    { mood: "Intimate", description: "A deep, passionate ballad" },
  ];

  const handleGenerate = async () => {
    if (!yourName.trim() || !partnerName.trim()) {
      toast({
        title: "Names Required",
        description: "Please enter both your name and your partner's name.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCurrentStep(1);

    try {
      for (let i = 0; i < 3; i++) {
        setCurrentStep(i + 1);
        
        // Start generation
        const response = await apiRequest('POST', '/api/creations', {
          type: 'song',
          recipientName: partnerName,
          occasion: 'date-night',
          tone: songMoods[i].mood.toLowerCase(),
          genre: i === 0 ? 'soul' : i === 1 ? 'pop' : 'r&b',
          voiceType: 'duet',
          customMessage: `A ${songMoods[i].mood.toLowerCase()} love song from ${yourName} to ${partnerName}${eventInfo ? `. Event details: ${eventInfo}` : ''}`,
        });
        
        const initialCreation = await response.json();
        
        // Poll for completion
        const completedCreation = await pollForCompletion(initialCreation.id);
        
        setSongs(prev => [...prev, {
          title: completedCreation.title || `${songMoods[i].mood} Love Song`,
          audioUrl: completedCreation.mediaUrl || '',
          coverUrl: completedCreation.imageUrl || '',
          mood: songMoods[i].mood,
        }]);
      }

      setCurrentStep(4);
      setShareLink(`${window.location.origin}/share/date-night-${Date.now()}`);
      
      toast({
        title: "Date Night Created!",
        description: "Your romantic songs are ready to share.",
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
      description: "Share this link with your partner.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <Badge className="mb-2 bg-rose-500">Date Night Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Your Romantic Songs
          </h1>
          <p className="text-muted-foreground mt-2">3 personalized love songs with matching cover art</p>
        </div>

        {currentStep === 0 && (
          <Card className="max-w-xl mx-auto border-rose-200 dark:border-rose-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                Enter Your Details
              </CardTitle>
              <CardDescription>We'll create 3 songs that progress from sweet to intimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  placeholder="Enter your name"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  data-testid="input-your-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partnerName">Your Partner's Name</Label>
                <Input
                  id="partnerName"
                  placeholder="Enter your partner's name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  data-testid="input-partner-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventInfo">Event Details (optional)</Label>
                <Textarea
                  id="eventInfo"
                  placeholder="Add details about your date night or relationship (e.g., anniversary, special memory, how you met...)"
                  value={eventInfo}
                  onChange={(e) => setEventInfo(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-event-info"
                />
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Your songs will include:</p>
                <div className="space-y-2">
                  {songMoods.map((song, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-rose-500" />
                      <span className="font-medium">{song.mood}:</span>
                      <span className="text-muted-foreground">{song.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-rose-500 hover:bg-rose-600"
                onClick={handleGenerate}
                disabled={generating}
                data-testid="button-generate-songs"
              >
                <Heart className="w-4 h-4 mr-2" />
                Generate My Love Songs
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card className="max-w-xl mx-auto border-rose-200 dark:border-rose-800">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creating Your Love Songs</h3>
              <p className="text-muted-foreground mb-6">
                Generating song {currentStep} of 3: {songMoods[currentStep - 1]?.mood || ''} 
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step < currentStep ? 'bg-rose-500' : 
                      step === currentStep ? 'bg-rose-500 animate-pulse' : 
                      'bg-rose-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && songs.length > 0 && (
          <div className="space-y-6">
            <Card className="border-rose-200 dark:border-rose-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Your Date Night is Ready!</CardTitle>
                <CardDescription>Share these songs with {partnerName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30"
                    >
                      <div className="w-16 h-16 rounded-lg bg-rose-200 dark:bg-rose-800 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-8 h-8 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-muted-foreground">{song.mood} love song</p>
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

            <Card className="border-rose-200 dark:border-rose-800">
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
                  <Button onClick={handleShare} data-testid="button-copy-link">
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
