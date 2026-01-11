import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, Music, Sparkles } from "lucide-react";

interface BackupResult {
  success: boolean;
  audioUrl: string;
  title: string;
  duration: number;
  generatedBy: string;
  lyrics?: string;
}

export default function TestLoudlyPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState("pop");
  const [tone, setTone] = useState("happy");
  const [recipientName, setRecipientName] = useState("Sarah");
  const [occasion, setOccasion] = useState("birthday");
  const [lyrics, setLyrics] = useState("");
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const generateLyrics = async () => {
    setIsGeneratingLyrics(true);
    setError(null);
    
    try {
      const response = await fetch("/api/test/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientName,
          occasion,
          genre,
          tone,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate lyrics");
      }
      
      setLyrics(data.lyrics);
    } catch (err: any) {
      setError(err.message || "Failed to generate lyrics");
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const generateSong = async () => {
    if (!lyrics.trim()) {
      setError("Please generate or enter lyrics first");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch("/api/test/backup-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `${occasion} song for ${recipientName}`,
          genre,
          tone,
          lyrics,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate");
      }
      
      setResult({ ...data, lyrics });
      
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        setAudioRef(audio);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate song");
    } finally {
      setIsGenerating(false);
    }
  };

  const playSong = () => {
    if (audioRef) {
      audioRef.play();
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6" />
              Test Backup Song Service
            </CardTitle>
            <CardDescription>
              Generate a test song using the backup service (songs with vocals)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient Name</label>
                <Input 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter name"
                  data-testid="input-recipient"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Occasion</label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger data-testid="select-occasion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="love">Love Song</SelectItem>
                    <SelectItem value="friendship">Friendship</SelectItem>
                    <SelectItem value="celebration">Celebration</SelectItem>
                    <SelectItem value="thank you">Thank You</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger data-testid="select-genre">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="r&b">R&B</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="gospel">Gospel</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Mood</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="select-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Lyrics</label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateLyrics}
                  disabled={isGeneratingLyrics || !recipientName.trim()}
                  data-testid="button-generate-lyrics"
                >
                  {isGeneratingLyrics ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3 w-3" />
                      Generate Lyrics
                    </>
                  )}
                </Button>
              </div>
              <Textarea 
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Click 'Generate Lyrics' or write your own lyrics here..."
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-lyrics"
              />
            </div>

            <Button 
              onClick={generateSong} 
              disabled={isGenerating || !lyrics.trim()}
              className="w-full"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Song (this may take a few minutes)...
                </>
              ) : (
                "Generate Test Song"
              )}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium">Song Generated!</p>
                  <p className="text-sm text-muted-foreground">
                    Title: {result.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {result.duration} seconds
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Service: {result.generatedBy}
                  </p>
                </div>

                <Button onClick={playSong} variant="outline" className="w-full" data-testid="button-play">
                  <Play className="mr-2 h-4 w-4" />
                  Play Song
                </Button>

                {result.audioUrl && (
                  <audio controls className="w-full" src={result.audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
