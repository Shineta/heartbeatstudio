import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Cake, Music, Sparkles, Loader2, Play, Share2, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedSong {
  title: string;
  audioUrl: string;
  coverUrl: string;
}

export default function CreateBirthdayBlast() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [birthdayPersonName, setBirthdayPersonName] = useState("");
  const [yourName, setYourName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [shareLink, setShareLink] = useState("");

  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const handleGenerate = async () => {
    if (!birthdayPersonName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the birthday person's name.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await apiRequest('POST', '/api/creations', {
        type: 'song',
        recipientName: birthdayPersonName,
        occasion: 'birthday',
        tone: 'joyful',
        genre: 'pop',
        voiceType: 'upbeat',
        customMessage: `A special birthday song for ${birthdayPersonName}${yourName ? ` from ${yourName}` : ''}`,
      });
      
      const creation = await response.json();
      
      setSong({
        title: creation.title || `Happy Birthday ${birthdayPersonName}`,
        audioUrl: creation.audioUrl || '',
        coverUrl: creation.coverArtUrl || '',
      });

      setShareLink(`${window.location.origin}/share/birthday-${Date.now()}`);
      
      toast({
        title: "Birthday Song Created!",
        description: "Your birthday song is ready to share.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link Copied!",
      description: "Share this link with the birthday person.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <Cake className="w-8 h-8 text-amber-500" />
          </div>
          <Badge className="mb-2 bg-amber-500">Birthday Blast Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create a Birthday Song
          </h1>
          <p className="text-muted-foreground mt-2">A personalized birthday song with festive artwork</p>
        </div>

        {!song && !generating && (
          <Card className="max-w-xl mx-auto border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Enter Birthday Details
              </CardTitle>
              <CardDescription>We'll create a joyful birthday song just for them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="birthdayName">Birthday Person's Name *</Label>
                <Input
                  id="birthdayName"
                  placeholder="Enter their name"
                  value={birthdayPersonName}
                  onChange={(e) => setBirthdayPersonName(e.target.value)}
                  data-testid="input-birthday-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name (optional)</Label>
                <Input
                  id="yourName"
                  placeholder="Enter your name"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  data-testid="input-your-name"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">You'll receive:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-500" />
                    1 personalized birthday song
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Festive birthday cover art
                  </li>
                  <li className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-500" />
                    Shareable link to send
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={handleGenerate}
                disabled={generating}
                data-testid="button-generate-song"
              >
                <Cake className="w-4 h-4 mr-2" />
                Generate Birthday Song
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card className="max-w-xl mx-auto border-amber-200 dark:border-amber-800">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creating Birthday Magic</h3>
              <p className="text-muted-foreground">
                Generating a special birthday song for {birthdayPersonName}...
              </p>
            </CardContent>
          </Card>
        )}

        {song && (
          <div className="space-y-6 max-w-xl mx-auto">
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Birthday Song Ready!</CardTitle>
                <CardDescription>Share this with {birthdayPersonName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <div className="w-20 h-20 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center overflow-hidden">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <Cake className="w-10 h-10 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{song.title}</h4>
                    <p className="text-sm text-muted-foreground">Birthday song for {birthdayPersonName}</p>
                  </div>
                  <Button size="icon" variant="ghost" data-testid="button-play">
                    <Play className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
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
                  <Button onClick={handleShare} className="bg-amber-500 hover:bg-amber-600" data-testid="button-copy-link">
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
