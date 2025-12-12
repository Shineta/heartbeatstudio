import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ListMusic, Play, Pause, SkipBack, SkipForward, Heart } from "lucide-react";
import type { Mixtape, Creation } from "@shared/schema";

interface MixtapeWithSongs extends Mixtape {
  songs: Creation[];
}

export default function MixtapePage() {
  const { link } = useParams<{ link: string }>();
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync audio state when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      setIsPlaying(false);
      audio.pause();
      audio.load();
    }
  }, [currentSongIndex]);

  const { data: mixtape, isLoading, error } = useQuery<MixtapeWithSongs>({
    queryKey: ['/api/share/mixtape', link],
    enabled: !!link,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading mixtape...</p>
        </div>
      </div>
    );
  }

  if (error || !mixtape) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Mixtape Not Found</h2>
            <p className="text-muted-foreground">
              This mixtape may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mixtape.status === 'generating') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ListMusic className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle>{mixtape.title}</CardTitle>
            <CardDescription>
              For {mixtape.recipientName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Creating Your Mixtape...</p>
            <p className="text-sm text-muted-foreground">
              This mixtape is still being generated. Please check back in a few minutes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mixtape.status === 'failed' || !mixtape.songs || mixtape.songs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Mixtape Unavailable</h2>
            <p className="text-muted-foreground">
              This mixtape could not be generated or has no songs available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSong = mixtape.songs[currentSongIndex];
  const themeDisplay = mixtape.theme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  const handlePrevious = () => {
    setCurrentSongIndex((prev) => (prev > 0 ? prev - 1 : mixtape.songs.length - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev < mixtape.songs.length - 1 ? prev + 1 : 0));
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary mb-4">
            <Heart className="w-4 h-4" />
            Made with love on Heartbeat Studio
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {mixtape.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            A {themeDisplay} Mixtape for {mixtape.recipientName}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            {currentSong?.imageUrl && (
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title || "Song cover"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold">{currentSong?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Song {currentSongIndex + 1} of {mixtape.songs.length}
                  {currentSong?.genre && ` • ${currentSong.genre}`}
                </p>
              </div>

              {currentSong?.mediaUrl && (
                <audio
                  ref={audioRef}
                  src={currentSong.mediaUrl}
                  className="w-full mb-4"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleNext}
                  data-testid="audio-mixtape-player"
                />
              )}

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  data-testid="button-previous-song"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12"
                  onClick={handlePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  data-testid="button-next-song"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-primary" />
              Tracklist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mixtape.songs.map((song, index) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setCurrentSongIndex(index);
                    setIsPlaying(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 text-left transition-colors hover-elevate ${
                    index === currentSongIndex ? 'bg-primary/10' : ''
                  }`}
                  data-testid={`button-song-${index}`}
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                    {song.imageUrl ? (
                      <img
                        src={song.imageUrl}
                        alt={song.title || "Song cover"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ListMusic className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.genre}
                    </p>
                  </div>
                  {index === currentSongIndex && isPlaying && (
                    <div className="flex gap-0.5">
                      <div className="w-1 h-4 bg-primary animate-pulse rounded" />
                      <div className="w-1 h-4 bg-primary animate-pulse rounded delay-75" />
                      <div className="w-1 h-4 bg-primary animate-pulse rounded delay-150" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {currentSong?.content && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Lyrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                {currentSong.content}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Create your own mixtapes at</p>
          <a href="/" className="text-primary hover:underline">
            Heartbeat Studio
          </a>
        </div>
      </div>
    </div>
  );
}
