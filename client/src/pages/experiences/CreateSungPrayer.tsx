import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HandHeart, Music, Sparkles, Loader2, Play, Pause, Share2, CheckCircle2, BookOpen, Heart, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { gospelGenres } from "@/lib/genres";

const thanksgivingPrompts = [
  { id: "blessings", label: "Thank God for blessings", text: "Thank you Lord for all Your blessings, for Your love that never ends" },
  { id: "family", label: "Thank God for family", text: "Thank you Lord for my family, for the love that we share" },
  { id: "health", label: "Thank God for health", text: "Thank you Lord for health and strength, for waking me up each day" },
  { id: "provision", label: "Thank God for provision", text: "Thank you Lord for Your provision, You supply all my needs" },
  { id: "grace", label: "Thank God for grace", text: "Thank you Lord for Your amazing grace, that saved a wretch like me" },
  { id: "custom", label: "Write your own thanksgiving", text: "" },
];

const declarationScriptures = [
  { ref: "Psalm 23:1", text: "The Lord is my shepherd, I shall not want" },
  { ref: "Isaiah 41:10", text: "Fear not, for I am with you; be not dismayed, for I am your God" },
  { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me" },
  { ref: "Romans 8:28", text: "All things work together for good for those who love God" },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you" },
  { ref: "Psalm 91:1-2", text: "He who dwells in the shelter of the Most High will rest in the shadow of the Almighty" },
  { ref: "Isaiah 54:17", text: "No weapon formed against me shall prosper" },
  { ref: "Deuteronomy 28:13", text: "The Lord will make you the head, not the tail" },
];

const promiseScriptures = [
  { ref: "Matthew 11:28", text: "Come to me, all who are weary, and I will give you rest" },
  { ref: "John 14:27", text: "Peace I leave with you; my peace I give you" },
  { ref: "Psalm 30:5", text: "Weeping may endure for a night, but joy comes in the morning" },
  { ref: "Isaiah 40:31", text: "Those who hope in the Lord will renew their strength" },
  { ref: "2 Chronicles 7:14", text: "If my people humble themselves and pray, I will heal their land" },
  { ref: "Malachi 3:10", text: "Test me in this and see if I will not open the floodgates of heaven" },
  { ref: "Psalm 103:3", text: "He forgives all your sins and heals all your diseases" },
  { ref: "Romans 8:37", text: "We are more than conquerors through Him who loved us" },
];

interface GeneratedPrayer {
  title: string;
  audioUrl: string;
  coverUrl: string;
}

async function pollForCompletion(creationId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await fetch(`/api/creations/${creationId}`, { credentials: 'include' });
    if (!response.ok) continue;
    const creation = await response.json();
    if (creation.status === 'ready') return creation;
    if (creation.status === 'failed') throw new Error('Prayer generation failed');
  }
  throw new Error('Generation timed out');
}

export default function CreateSungPrayer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [recipientName, setRecipientName] = useState("");
  const [prayerFor, setPrayerFor] = useState("myself");
  const [intention, setIntention] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("gospel");
  
  const [thanksgivingType, setThanksgivingType] = useState("blessings");
  const [customThanksgiving, setCustomThanksgiving] = useState("");
  
  const [selectedDeclaration, setSelectedDeclaration] = useState<typeof declarationScriptures[0] | null>(declarationScriptures[0]);
  const [customDeclaration, setCustomDeclaration] = useState("");
  
  const [selectedPromise, setSelectedPromise] = useState<typeof promiseScriptures[0] | null>(promiseScriptures[0]);
  const [customPromise, setCustomPromise] = useState("");
  
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [prayer, setPrayer] = useState<GeneratedPrayer | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!prayer?.audioUrl) {
      toast({
        title: "Audio Not Available",
        description: "This prayer's audio is still processing.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(prayer.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
        toast({
          title: "Playback Error",
          description: "Unable to play the audio. Please try again.",
          variant: "destructive",
        });
      });
      setIsPlaying(true);
    }
  };

  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const handleGenerate = async () => {
    if (prayerFor === "someone" && !recipientName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter who you're praying for.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCurrentStep(1);

    try {
      const thanksgivingText = thanksgivingType === "custom" 
        ? customThanksgiving 
        : thanksgivingPrompts.find(t => t.id === thanksgivingType)?.text || "";
      
      const declarationText = customDeclaration.trim() 
        ? customDeclaration 
        : selectedDeclaration 
          ? `${selectedDeclaration.ref}: ${selectedDeclaration.text}` 
          : "";
      
      const promiseText = customPromise.trim() 
        ? customPromise 
        : selectedPromise 
          ? `${selectedPromise.ref}: ${selectedPromise.text}` 
          : "";

      const prayerTarget = prayerFor === "myself" ? "me" : recipientName;
      
      const prayerStructure = `
Create a sung prayer following this THREE-PART BIBLICAL PRAYER STRUCTURE:

PART 1 - THANKSGIVING (Opening with Gratitude):
${thanksgivingText}

PART 2 - DECLARE GOD'S WORD (Speaking Scripture):
${declarationText}

PART 3 - CLAIMING PROMISES (Standing on God's Promises):
${promiseText}

This prayer is for ${prayerTarget}.${intention ? ` Prayer intention: ${intention}` : ''}

The song should flow naturally through all three parts, creating a complete prayer experience. Each section should be clearly identifiable in the lyrics. Make it heartfelt, sincere, and spiritually uplifting.`;

      setCurrentStep(2);
      
      const response = await apiRequest('POST', '/api/creations', {
        type: 'song',
        recipientName: prayerFor === "myself" ? "Me" : recipientName,
        occasion: 'prayer',
        tone: 'prayerful',
        genre: selectedGenre,
        voiceType: 'soulful',
        customMessage: prayerStructure,
      });
      
      const initialCreation = await response.json();
      
      setCurrentStep(3);
      const completedCreation = await pollForCompletion(initialCreation.id);
      
      setPrayer({
        title: completedCreation.title || "Sung Prayer",
        audioUrl: completedCreation.mediaUrl || '',
        coverUrl: completedCreation.imageUrl || '',
      });

      setCurrentStep(4);
      setShareLink(`${window.location.origin}/share/prayer-${Date.now()}`);
      
      toast({
        title: "Sung Prayer Created!",
        description: "Your prayer song is ready.",
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
      description: "Share this prayer blessing with others.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <HandHeart className="w-8 h-8 text-amber-600" />
          </div>
          <Badge className="mb-2 bg-amber-500">Sung Prayer Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Your Sung Prayer
          </h1>
          <p className="text-muted-foreground mt-2">Thanksgiving, Declaration, and Promises</p>
        </div>

        {currentStep === 0 && (
          <div className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  Who is this prayer for?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={prayerFor === "myself" ? "default" : "outline"}
                    onClick={() => setPrayerFor("myself")}
                    className={prayerFor === "myself" ? "bg-amber-500 hover:bg-amber-600" : ""}
                    data-testid="button-prayer-myself"
                  >
                    For Myself
                  </Button>
                  <Button
                    variant={prayerFor === "someone" ? "default" : "outline"}
                    onClick={() => setPrayerFor("someone")}
                    className={prayerFor === "someone" ? "bg-amber-500 hover:bg-amber-600" : ""}
                    data-testid="button-prayer-someone"
                  >
                    For Someone Else
                  </Button>
                </div>
                
                {prayerFor === "someone" && (
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Their Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="Enter their name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      data-testid="input-recipient-name"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="intention">Prayer Intention (optional)</Label>
                  <Textarea
                    id="intention"
                    placeholder="What is this prayer for? (healing, guidance, peace, etc.)"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-intention"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Music Style</Label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger data-testid="select-genre">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {gospelGenres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">1</span>
                  Thanksgiving
                </CardTitle>
                <CardDescription>Start your prayer with gratitude</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {thanksgivingPrompts.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant={thanksgivingType === prompt.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setThanksgivingType(prompt.id)}
                      className={thanksgivingType === prompt.id ? "bg-amber-500 hover:bg-amber-600" : ""}
                      data-testid={`button-thanksgiving-${prompt.id}`}
                    >
                      {prompt.label}
                    </Button>
                  ))}
                </div>
                
                {thanksgivingType === "custom" && (
                  <Textarea
                    placeholder="Write your thanksgiving..."
                    value={customThanksgiving}
                    onChange={(e) => setCustomThanksgiving(e.target.value)}
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-custom-thanksgiving"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">2</span>
                  Declare God's Word
                </CardTitle>
                <CardDescription>Speak and affirm scripture over your life</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-40 rounded-md border p-2">
                  <div className="space-y-2">
                    {declarationScriptures.map((scripture) => (
                      <div
                        key={scripture.ref}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          selectedDeclaration?.ref === scripture.ref
                            ? "bg-amber-100 dark:bg-amber-900/50 border border-amber-300"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setSelectedDeclaration(scripture);
                          setCustomDeclaration("");
                        }}
                        data-testid={`declaration-${scripture.ref}`}
                      >
                        <p className="font-medium text-sm">{scripture.ref}</p>
                        <p className="text-xs text-muted-foreground">{scripture.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="space-y-2">
                  <Label>Or enter your own scripture:</Label>
                  <Textarea
                    placeholder="Enter your own declaration scripture..."
                    value={customDeclaration}
                    onChange={(e) => {
                      setCustomDeclaration(e.target.value);
                      if (e.target.value.trim()) setSelectedDeclaration(null);
                    }}
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-custom-declaration"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">3</span>
                  Claim God's Promises
                </CardTitle>
                <CardDescription>Stand on the biblical promises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-40 rounded-md border p-2">
                  <div className="space-y-2">
                    {promiseScriptures.map((scripture) => (
                      <div
                        key={scripture.ref}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          selectedPromise?.ref === scripture.ref
                            ? "bg-amber-100 dark:bg-amber-900/50 border border-amber-300"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setSelectedPromise(scripture);
                          setCustomPromise("");
                        }}
                        data-testid={`promise-${scripture.ref}`}
                      >
                        <p className="font-medium text-sm">{scripture.ref}</p>
                        <p className="text-xs text-muted-foreground">{scripture.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="space-y-2">
                  <Label>Or enter your own promise:</Label>
                  <Textarea
                    placeholder="Enter your own promise scripture..."
                    value={customPromise}
                    onChange={(e) => {
                      setCustomPromise(e.target.value);
                      if (e.target.value.trim()) setSelectedPromise(null);
                    }}
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-custom-promise"
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleGenerate}
              className="w-full bg-amber-500 hover:bg-amber-600"
              size="lg"
              data-testid="button-generate-prayer"
            >
              <HandHeart className="w-5 h-5 mr-2" />
              Create My Sung Prayer
            </Button>
          </div>
        )}

        {generating && (
          <Card className="max-w-md mx-auto border-amber-200 dark:border-amber-800">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Creating Your Sung Prayer</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className={currentStep >= 1 ? "text-amber-600 font-medium" : ""}>
                  {currentStep >= 1 && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  Preparing prayer structure...
                </p>
                <p className={currentStep >= 2 ? "text-amber-600 font-medium" : ""}>
                  {currentStep >= 2 && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  Composing your prayer song...
                </p>
                <p className={currentStep >= 3 ? "text-amber-600 font-medium" : ""}>
                  {currentStep >= 3 && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  Generating vocals and music...
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">This may take a few minutes</p>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && prayer && (
          <div className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="aspect-square max-w-sm mx-auto p-4">
                {prayer.coverUrl ? (
                  <img 
                    src={prayer.coverUrl} 
                    alt="Prayer cover" 
                    className="w-full h-full object-cover rounded-lg"
                    data-testid="img-prayer-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-lg flex items-center justify-center" data-testid="img-prayer-cover-placeholder">
                    <HandHeart className="w-24 h-24 text-amber-600" />
                  </div>
                )}
              </div>
              <CardContent className="text-center pb-6">
                <h3 className="text-xl font-bold mb-2" data-testid="text-prayer-title">{prayer.title}</h3>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-prayer-subtitle">Your Sung Prayer</p>
                
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    className="bg-amber-500 hover:bg-amber-600"
                    data-testid="button-play-prayer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Play Prayer
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleShare}
                    data-testid="button-share-prayer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentStep(0);
                  setPrayer(null);
                  audioRef.current?.pause();
                  audioRef.current = null;
                }}
                data-testid="button-create-another"
              >
                Create Another Prayer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
