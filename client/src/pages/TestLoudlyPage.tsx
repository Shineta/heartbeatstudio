import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, Music } from "lucide-react";

interface BackupResult {
  success: boolean;
  audioUrl: string;
  title: string;
  duration: number;
  generatedBy: string;
}

export default function TestLoudlyPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState("pop");
  const [tone, setTone] = useState("happy");
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const generateSong = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch("/api/test/backup-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Test Song",
          genre,
          tone,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate");
      }
      
      setResult(data);
      
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

            <Button 
              onClick={generateSong} 
              disabled={isGenerating}
              className="w-full"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating (this may take a minute)...
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
