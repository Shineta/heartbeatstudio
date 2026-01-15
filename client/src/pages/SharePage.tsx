import { useEffect, useState, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Download, Sparkles, Play, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttachedSong {
  id: string;
  title: string;
  mediaUrl: string;
}

interface AttachedAnimation {
  id: string;
  title: string;
  mediaUrl: string;
  loop?: boolean;
}

interface Creation {
  id: string;
  type: 'song' | 'card' | 'animation';
  title: string;
  content: string;
  tone?: string;
  genre?: string;
  imageUrl?: string;
  mediaUrl?: string;
  songIds?: string[];
  animationId?: string;
  loop?: boolean;
  attachedSongs?: AttachedSong[];
  attachedAnimation?: AttachedAnimation;
  shareableLink?: string;
  createdAt: string;
}

export default function SharePage() {
  const [, params] = useRoute('/share/:link');
  const [, setLocation] = useLocation();
  const shareLink = params?.link;
  const [creation, setCreation] = useState<Creation | null>(null);
  const [attachedSong, setAttachedSong] = useState<AttachedSong | null>(null);
  const [attachedAnimation, setAttachedAnimation] = useState<AttachedAnimation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songStarted, setSongStarted] = useState(false);
  const [cardSongStarted, setCardSongStarted] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [cardVideoStarted, setCardVideoStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleComingSoon = () => {
    toast({
      title: "Coming Soon!",
      description: "Heartbeat Studio is launching soon. Stay tuned for AI-powered songs, cards, and more!",
    });
  };

  const handlePlaySong = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setSongStarted(true);
    }
  };

  const handlePlayCardSong = () => {
    if (cardAudioRef.current) {
      cardAudioRef.current.play();
      setCardSongStarted(true);
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoStarted(true);
      // Also play attached song if there is one
      if (cardAudioRef.current && attachedSong) {
        cardAudioRef.current.play();
        setCardSongStarted(true);
      }
    }
  };
  
  const handlePlayCardVideo = () => {
    if (cardVideoRef.current) {
      cardVideoRef.current.play();
      setCardVideoStarted(true);
    }
  };

  useEffect(() => {
    const fetchSharedCreation = async () => {
      if (!shareLink) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/share/${shareLink}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This creation could not be found. It may have been deleted.');
          } else {
            setError('Failed to load creation');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCreation(data);
        
        // If this is a card or animation with attached songs, use the first one
        if ((data.type === 'card' || data.type === 'animation') && data.attachedSongs && data.attachedSongs.length > 0) {
          const firstSong = data.attachedSongs[0];
          if (firstSong.mediaUrl) {
            setAttachedSong(firstSong);
          }
        }
        
        // If this is a card with an attached animation, set it
        if (data.type === 'card' && data.attachedAnimation && data.attachedAnimation.mediaUrl) {
          setAttachedAnimation(data.attachedAnimation);
        }
      } catch (err) {
        setError('Failed to load creation');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCreation();
  }, [shareLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your special gift...</p>
        </div>
      </div>
    );
  }

  if (error || !creation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Oops!</CardTitle>
            <CardDescription>{error || 'Creation not found'}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button data-testid="button-home" onClick={handleComingSoon}>
              <Heart className="w-4 h-4 mr-2" />
              Go to Heartbeat Studio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary heartbeat" />
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-tight">Heartbeat Studio</span>
              <span className="text-xs text-muted-foreground">By Hortons Tech Innovations</span>
            </div>
          </div>
          <Button variant="outline" size="sm" data-testid="button-create-own" onClick={() => setLocation('/create')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Your Own
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Someone Made This For You! 💝
            </h1>
            <p className="text-lg text-muted-foreground">
              A special {creation.type} created with love
            </p>
          </div>

          {/* Creation Card */}
          <Card className="overflow-hidden">
            {creation.imageUrl && (
              <div className="w-full">
                <img 
                  src={creation.imageUrl} 
                  alt={creation.title}
                  className="w-full h-auto"
                />
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2" data-testid="text-creation-title">
                    {creation.title}
                  </CardTitle>
                  {(creation.tone || creation.genre) && (
                    <CardDescription>
                      {creation.tone && <span className="capitalize">{creation.tone}</span>}
                      {creation.tone && creation.genre && ' • '}
                      {creation.genre && <span className="capitalize">{creation.genre}</span>}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Song Audio Player */}
              {creation.type === 'song' && creation.mediaUrl && (
                <div className="space-y-4">
                  {!songStarted && (
                    <div className="flex justify-center py-6">
                      <Button 
                        size="lg" 
                        onClick={handlePlaySong}
                        className="h-20 px-12 text-xl gap-3 animate-pulse"
                        data-testid="button-play-song"
                      >
                        <Play className="w-8 h-8" />
                        Play Your Song
                      </Button>
                    </div>
                  )}
                  <audio 
                    ref={audioRef}
                    controls 
                    className="w-full"
                    data-testid="audio-player"
                  >
                    <source src={creation.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Animation Video Player */}
              {creation.type === 'animation' && creation.mediaUrl && (
                <div className="space-y-4">
                  {!videoStarted && (
                    <div className="flex justify-center py-6">
                      <Button 
                        size="lg" 
                        onClick={handlePlayVideo}
                        className="h-20 px-12 text-xl gap-3 animate-pulse"
                        data-testid="button-play-video"
                      >
                        <Video className="w-8 h-8" />
                        Play Your Animation
                      </Button>
                    </div>
                  )}
                  <video 
                    ref={videoRef}
                    controls 
                    loop={creation.loop ?? false}
                    className="w-full rounded-lg"
                    data-testid="video-player"
                  >
                    <source src={creation.mediaUrl} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                  {creation.loop && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This animation will loop continuously
                    </p>
                  )}
                </div>
              )}

              {/* Attached Song Player for Animations */}
              {creation.type === 'animation' && attachedSong && (
                <div className="space-y-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">A Song For You</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{attachedSong.title}</p>
                  {!cardSongStarted && (
                    <div className="flex justify-center py-4">
                      <Button 
                        size="lg" 
                        onClick={handlePlayCardSong}
                        className="h-16 px-10 text-lg gap-3 animate-pulse"
                        data-testid="button-play-animation-song"
                      >
                        <Play className="w-6 h-6" />
                        Play Song
                      </Button>
                    </div>
                  )}
                  <audio 
                    ref={cardAudioRef}
                    controls 
                    className="w-full"
                    data-testid="animation-audio-player"
                  >
                    <source src={attachedSong.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Attached Song Player for Cards */}
              {creation.type === 'card' && attachedSong && (
                <div className="space-y-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">A Song For You</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{attachedSong.title}</p>
                  {!cardSongStarted && (
                    <div className="flex justify-center py-4">
                      <Button 
                        size="lg" 
                        onClick={handlePlayCardSong}
                        className="h-16 px-10 text-lg gap-3 animate-pulse"
                        data-testid="button-play-card-song"
                      >
                        <Play className="w-6 h-6" />
                        Play Song
                      </Button>
                    </div>
                  )}
                  <audio 
                    ref={cardAudioRef}
                    controls 
                    className="w-full"
                    data-testid="card-audio-player"
                  >
                    <source src={attachedSong.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Attached Animation Player for Cards */}
              {creation.type === 'card' && attachedAnimation && (
                <div className="space-y-4 bg-gradient-to-r from-purple-500/10 to-pink-500/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-lg">An Animation For You</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{attachedAnimation.title}</p>
                  {!cardVideoStarted && (
                    <div className="flex justify-center py-4">
                      <Button 
                        size="lg" 
                        onClick={handlePlayCardVideo}
                        className="h-16 px-10 text-lg gap-3 animate-pulse bg-purple-500 hover:bg-purple-600"
                        data-testid="button-play-card-video"
                      >
                        <Video className="w-6 h-6" />
                        Play Animation
                      </Button>
                    </div>
                  )}
                  <video 
                    ref={cardVideoRef}
                    controls 
                    loop={attachedAnimation.loop ?? false}
                    className="w-full rounded-lg"
                    data-testid="card-video-player"
                  >
                    <source src={attachedAnimation.mediaUrl} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                  {attachedAnimation.loop && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This animation will loop continuously
                    </p>
                  )}
                </div>
              )}

              {/* Lyrics / Content */}
              {creation.content && creation.type !== 'animation' && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">
                    {creation.type === 'song' ? 'Lyrics' : 'Message'}
                  </h3>
                  <div 
                    className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap"
                    data-testid="text-content"
                  >
                    {creation.content}
                  </div>
                </div>
              )}
              
              {/* Sweet message for animations */}
              {creation.type === 'animation' && creation.content && (
                <div className="text-center py-4">
                  <p className="text-lg text-muted-foreground italic">
                    "{creation.content}"
                  </p>
                </div>
              )}

              {/* Download Button */}
              {creation.mediaUrl && (
                <div className="flex justify-center pt-4">
                  <a 
                    href={creation.mediaUrl} 
                    download={`${creation.title}.${creation.type === 'animation' ? 'mp4' : 'mp3'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" data-testid="button-download">
                      <Download className="w-4 h-4 mr-2" />
                      Download {creation.type === 'song' ? 'Song' : 'Video'}
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className="text-center mt-12 p-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <h2 className="text-2xl font-bold mb-3">
              Want to Create Something Special Too?
            </h2>
            <p className="text-muted-foreground mb-6">
              Make personalized AI-powered songs, cards, and animations for your loved ones
            </p>
            <Button size="lg" data-testid="button-get-started" onClick={() => setLocation('/create')}>
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
