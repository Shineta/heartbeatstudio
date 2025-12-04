import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Download, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

interface Creation {
  id: string;
  type: 'song' | 'card' | 'animation';
  title: string;
  content: string;
  tone?: string;
  genre?: string;
  imageUrl?: string;
  mediaUrl?: string;
  shareableLink?: string;
  createdAt: string;
}

export default function SharePage() {
  const [, params] = useRoute('/share/:link');
  const shareLink = params?.link;
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <Link href="/">
              <Button data-testid="button-home">
                <Heart className="w-4 h-4 mr-2" />
                Go to Heartbeat Studio
              </Button>
            </Link>
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
            <span className="font-bold text-xl">Heartbeat Studio</span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-create-own">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Your Own
            </Button>
          </Link>
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
                <div className="space-y-3">
                  <audio 
                    controls 
                    className="w-full"
                    data-testid="audio-player"
                  >
                    <source src={creation.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Lyrics / Content */}
              {creation.content && (
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

              {/* Download Button */}
              {creation.mediaUrl && (
                <div className="flex justify-center pt-4">
                  <a 
                    href={creation.mediaUrl} 
                    download={`${creation.title}.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" data-testid="button-download">
                      <Download className="w-4 h-4 mr-2" />
                      Download Song
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
            <Link href="/">
              <Button size="lg" data-testid="button-get-started">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
