import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Music, Heart, Sparkles, Calendar, Share2, Palette, Mic, Clock, Gift } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Everything You Need to Create Magic
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Heartbeat Studio gives you powerful AI tools to create personalized songs, cards, and celebrations for the people you love.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Song Generation</h3>
                <p className="text-muted-foreground text-sm">
                  Create personalized songs with custom lyrics, multiple genres, and professional-quality audio.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Questionnaire</h3>
                <p className="text-muted-foreground text-sm">
                  Our AI asks personalized follow-up questions to create deeply meaningful, one-of-a-kind songs.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Custom Cover Art</h3>
                <p className="text-muted-foreground text-sm">
                  Each song comes with unique AI-generated cassette cover art that matches your song's vibe.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Multiple Genres</h3>
                <p className="text-muted-foreground text-sm">
                  Choose from R&B, Gospel, Rap, Jazz, Soul, Hip-Hop, and more—with detailed sub-genre options.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Extended Songs</h3>
                <p className="text-muted-foreground text-sm">
                  Generate full-length songs up to 3 minutes with multiple verses, hooks, and professional structure.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Experience Kits</h3>
                <p className="text-muted-foreground text-sm">
                  Pre-designed experiences for Date Night, Birthdays, Gospel Greetings, and Classroom Cheers.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Sharing</h3>
                <p className="text-muted-foreground text-sm">
                  Share your creations with a unique link—no account needed for recipients to enjoy.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Schedule Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Plan ahead and schedule your song to be delivered at the perfect moment.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loved Ones Profiles</h3>
                <p className="text-muted-foreground text-sm">
                  Save details about the people you celebrate to make future songs even more personal.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <Button size="lg" data-testid="link-features-pricing">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
