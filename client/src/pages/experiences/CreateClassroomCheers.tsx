import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Music, Sparkles, Loader2, Play, Share2, CheckCircle2, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedSong {
  title: string;
  audioUrl: string;
  coverUrl: string;
  theme: string;
}

// Poll for creation completion
async function pollForCompletion(creationId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await fetch(`/api/creations/${creationId}`, { credentials: 'include' });
    if (!response.ok) continue;
    const creation = await response.json();
    if (creation.status === 'ready') return creation;
    if (creation.status === 'failed') throw new Error('Song generation failed');
  }
  throw new Error('Generation timed out');
}

export default function CreateClassroomCheers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [className, setClassName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("elementary");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [songs, setSongs] = useState<GeneratedSong[]>([]);
  const [shareLink, setShareLink] = useState("");

  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const songThemes = [
    { theme: "Welcome", description: "Start the day with energy" },
    { theme: "Teamwork", description: "Working together makes us stronger" },
    { theme: "Learning", description: "Celebrating curiosity and growth" },
    { theme: "Encouragement", description: "You can do anything you set your mind to" },
    { theme: "Celebration", description: "End of year or achievement celebration" },
  ];

  const gradeLevels = [
    { value: "preschool", label: "Pre-K / Preschool" },
    { value: "elementary", label: "Elementary School" },
    { value: "middle", label: "Middle School" },
    { value: "high", label: "High School" },
  ];

  const handleGenerate = async () => {
    if (!className.trim()) {
      toast({
        title: "Class Name Required",
        description: "Please enter a class or team name.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCurrentStep(1);

    try {
      for (let i = 0; i < 5; i++) {
        setCurrentStep(i + 1);
        
        const response = await apiRequest('POST', '/api/creations', {
          type: 'song',
          recipientName: className,
          occasion: 'classroom',
          tone: 'encouraging',
          genre: 'kids',
          voiceType: 'cheerful',
          customMessage: `A ${songThemes[i].theme.toLowerCase()} song for ${className}${teacherName ? ` with ${teacherName}` : ''}`,
        });
        
        const initialCreation = await response.json();
        
        // Poll for completion
        const completedCreation = await pollForCompletion(initialCreation.id);
        
        setSongs(prev => [...prev, {
          title: completedCreation.title || `${songThemes[i].theme} Song`,
          audioUrl: completedCreation.mediaUrl || '',
          coverUrl: completedCreation.imageUrl || '',
          theme: songThemes[i].theme,
        }]);
      }

      setCurrentStep(6);
      setShareLink(`${window.location.origin}/share/classroom-${Date.now()}`);
      
      toast({
        title: "Classroom Songs Created!",
        description: "Your songs are ready to share with students and families.",
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
      description: "Share this with students and parents.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <GraduationCap className="w-8 h-8 text-emerald-500" />
          </div>
          <Badge className="mb-2 bg-emerald-500">Classroom Cheers Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Classroom Songs
          </h1>
          <p className="text-muted-foreground mt-2">5 group songs with coordinated visuals</p>
        </div>

        {currentStep === 0 && (
          <Card className="max-w-xl mx-auto border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Enter Class Details
              </CardTitle>
              <CardDescription>Create encouraging songs for your students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="className">Class or Team Name *</Label>
                <Input
                  id="className"
                  placeholder="e.g., Mrs. Smith's 3rd Grade, The Tigers"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  data-testid="input-class-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teacherName">Teacher Name (optional)</Label>
                <Input
                  id="teacherName"
                  placeholder="e.g., Mrs. Smith"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  data-testid="input-teacher-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger data-testid="select-grade-level">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">You'll receive 5 songs:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {songThemes.map((song, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium">{song.theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={handleGenerate}
                disabled={generating}
                data-testid="button-generate-songs"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Generate Classroom Songs
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card className="max-w-xl mx-auto border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creating Classroom Songs</h3>
              <p className="text-muted-foreground mb-6">
                Generating song {currentStep} of 5: {songThemes[currentStep - 1]?.theme || ''}
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step < currentStep ? 'bg-emerald-500' : 
                      step === currentStep ? 'bg-emerald-500 animate-pulse' : 
                      'bg-emerald-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && songs.length > 0 && (
          <div className="space-y-6">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Classroom Songs Ready!</CardTitle>
                <CardDescription>Share these with {className}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30"
                    >
                      <div className="w-16 h-16 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-8 h-8 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-muted-foreground">{song.theme} song</p>
                      </div>
                      <Button size="icon" variant="ghost" data-testid={`button-play-${idx}`}>
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-800">
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
                  <Button onClick={handleShare} className="bg-emerald-500 hover:bg-emerald-600" data-testid="button-copy-link">
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
