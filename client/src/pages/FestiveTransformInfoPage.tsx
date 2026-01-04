import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Upload, Image, Palette, Clock, CheckCircle } from "lucide-react";

export default function FestiveTransformInfoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link href="/create">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Create
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Festive Transform
          </h1>
          <p className="text-muted-foreground text-lg">
            Turn any photo into a magical festive scene
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Upload a Photo</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a clear photo of one person. The photo should show the person's face and upper body for best results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Image className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Pick a Festive Scene</p>
                    <p className="text-sm text-muted-foreground">
                      Select from 27+ scenes including holidays (Christmas, Hanukkah, Diwali), life events (Birthday, Graduation), and seasonal themes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Choose an Art Style</p>
                    <p className="text-sm text-muted-foreground">
                      Pick from styles like Photo-Realistic, Cartoon, Watercolor, Oil Painting, Digital Art, or Vintage.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">AI Creates Your Image</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI transforms your photo into the chosen scene. This typically takes 30-60 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                Tips for Best Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Use a photo with good lighting and a clear view of the face</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Photos with simple backgrounds work better than busy ones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Front-facing or slight angle photos give the best transformations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Single-person photos only (for group photos, use Family Portrait)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                Available Scenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-primary">Holidays</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>Christmas</li>
                    <li>Hanukkah</li>
                    <li>Kwanzaa</li>
                    <li>Diwali</li>
                    <li>Eid</li>
                    <li>Easter</li>
                    <li>Halloween</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-primary">Life Events</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>Birthday</li>
                    <li>Graduation</li>
                    <li>Wedding</li>
                    <li>Baby Shower</li>
                    <li>Anniversary</li>
                    <li>Retirement</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-primary">Seasonal</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>Valentine's Day</li>
                    <li>Mother's Day</li>
                    <li>Father's Day</li>
                    <li>Thanksgiving</li>
                    <li>New Year's</li>
                    <li>Fourth of July</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <Link href="/create">
              <Button size="lg" data-testid="button-try-now">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Festive Transform Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
