import { ArrowLeft, Upload, Users, Wand2, Image, Sparkles, Camera, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import heroImage from "@assets/generated_images/family_portrait_studio_example.png";
import watercolorExample from "@assets/generated_images/watercolor_family_portrait_style.png";
import christmasExample from "@assets/generated_images/christmas_family_portrait_example.png";
import goodPhotoWoman from "@assets/generated_images/good_photo_example_woman.png";
import goodPhotoMan from "@assets/generated_images/good_photo_example_man.png";
import goodPhotoChild from "@assets/generated_images/good_photo_example_child.png";

export default function FamilyPortraitHelpPage() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Photos",
      description: "Upload 2-6 individual photos of the people you want in your portrait. Each photo should clearly show one person's face."
    },
    {
      icon: Users,
      title: "Select Faces",
      description: "Our AI automatically detects faces in your photos. Select which faces to include in your group portrait. You can also mark any pets!"
    },
    {
      icon: Image,
      title: "Choose a Scene",
      description: "Pick from 27+ scene options including holidays (Christmas, Hanukkah, Diwali), life events (graduation, wedding), or classic settings (studio, outdoors)."
    },
    {
      icon: Wand2,
      title: "Select a Style",
      description: "Choose an artistic style: studio photo, watercolor, cartoon, oil painting, digital art, or vintage."
    },
    {
      icon: Sparkles,
      title: "Generate Portrait",
      description: "Our AI combines everyone into a beautiful group portrait in your chosen scene and style. You'll see 5 variations to choose from!"
    }
  ];

  const tips = [
    "Use clear, well-lit photos where faces are easily visible",
    "Front-facing photos work best for accurate face detection",
    "Photos with similar lighting produce more natural-looking results",
    "You can include pets - just mark them during face selection",
    "The 'remove braces' option works best with clear smile photos"
  ];

  const styleExamples = [
    { name: "Studio Photo", image: heroImage, description: "Professional photography style" },
    { name: "Watercolor", image: watercolorExample, description: "Artistic brush strokes" },
    { name: "Holiday Scene", image: christmasExample, description: "Festive celebrations" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/create">
            <Button variant="ghost" className="gap-2" data-testid="button-back-to-create">
              <ArrowLeft className="w-4 h-4" />
              Back to Create
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold" data-testid="text-page-title">AI Family Portrait Composer</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create beautiful group portraits by combining individual photos into one magical scene
          </p>
        </div>

        <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
          <img 
            src={heroImage} 
            alt="Example AI-generated family portrait" 
            className="w-full h-auto object-cover"
            data-testid="img-hero-portrait"
          />
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={index}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Step {index + 1}: {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Example Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {styleExamples.map((example) => (
              <Card key={example.name} className="overflow-hidden">
                <div className="aspect-square">
                  <img 
                    src={example.image} 
                    alt={`${example.name} style example`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">{example.name}</h3>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Ideal Photos to Upload</h2>
          <p className="text-muted-foreground mb-6">
            For the best results, upload photos like these examples - clear, well-lit, and front-facing:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img 
                  src={goodPhotoWoman} 
                  alt="Good photo example - woman"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-green-500/90 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ideal
                </Badge>
              </div>
              <CardContent className="p-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Clear, well-lit face
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Front-facing view
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Natural expression
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img 
                  src={goodPhotoMan} 
                  alt="Good photo example - man"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-green-500/90 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ideal
                </Badge>
              </div>
              <CardContent className="p-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Good lighting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Clean background
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Single person visible
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img 
                  src={goodPhotoChild} 
                  alt="Good photo example - child"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-green-500/90 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ideal
                </Badge>
              </div>
              <CardContent className="p-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Face clearly visible
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Natural smile
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Eyes looking forward
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Available Scenes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Classic Scenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Studio Portrait</li>
                  <li>Living Room</li>
                  <li>Outdoors/Nature</li>
                  <li>Beach</li>
                  <li>Garden</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Life Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Birthday Party</li>
                  <li>Graduation</li>
                  <li>Wedding</li>
                  <li>Baby Shower</li>
                  <li>Anniversary</li>
                  <li>Retirement</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Christmas, Hanukkah, Kwanzaa</li>
                  <li>New Year's, Thanksgiving</li>
                  <li>Easter, Passover</li>
                  <li>Valentine's Day</li>
                  <li>Mother's/Father's Day</li>
                  <li>Diwali, Eid, Lunar New Year</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">All Artistic Styles</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Studio Photo', 'Watercolor', 'Cartoon', 'Oil Painting', 'Digital Art', 'Vintage'].map((style) => (
              <Card key={style}>
                <CardContent className="p-4 text-center">
                  <p className="font-medium">{style}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link href="/create">
            <Button size="lg" className="gap-2" data-testid="button-start-creating">
              <Sparkles className="w-5 h-5" />
              Start Creating
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
