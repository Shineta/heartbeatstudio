import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Church, Music, Sparkles, Loader2, Play, Pause, Share2, CheckCircle2, BookOpen, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { gospelGenres, rapSubGenres } from "@/lib/genres";

// Popular full passages for quick-fill
const popularPassages = [
  {
    name: "Psalm 23 (Full)",
    ref: "Psalm 23",
    text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for his name's sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me. You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows. Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever."
  },
  {
    name: "The Lord's Prayer",
    ref: "Matthew 6:9-13",
    text: "Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us. And lead us not into temptation, but deliver us from evil. For thine is the kingdom, and the power, and the glory, forever. Amen."
  },
  {
    name: "Love Chapter",
    ref: "1 Corinthians 13:4-8",
    text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres. Love never fails."
  },
  {
    name: "Beatitudes",
    ref: "Matthew 5:3-12",
    text: "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they will be comforted. Blessed are the meek, for they will inherit the earth. Blessed are those who hunger and thirst for righteousness, for they will be filled. Blessed are the merciful, for they will be shown mercy. Blessed are the pure in heart, for they will see God. Blessed are the peacemakers, for they will be called children of God."
  },
  {
    name: "Armor of God",
    ref: "Ephesians 6:10-17",
    text: "Be strong in the Lord and in his mighty power. Put on the full armor of God. Stand firm with the belt of truth, the breastplate of righteousness, feet fitted with readiness from the gospel of peace. Take up the shield of faith, the helmet of salvation, and the sword of the Spirit, which is the word of God."
  }
];

// Popular Bible verses organized by theme
const bibleVerses = {
  faith: [
    { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
    { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways acknowledge Him, and He will make your paths straight." },
    { ref: "Matthew 17:20", text: "If you have faith as small as a mustard seed, you can say to this mountain, 'Move from here to there,' and it will move." },
    { ref: "Romans 10:17", text: "So faith comes from hearing, and hearing through the word of Christ." },
    { ref: "Mark 11:24", text: "Whatever you ask for in prayer, believe that you have received it, and it will be yours." },
  ],
  hope: [
    { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
    { ref: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." },
    { ref: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary." },
    { ref: "Psalm 42:11", text: "Why are you downcast, O my soul? Put your hope in God, for I will yet praise Him, my Savior and my God." },
    { ref: "Lamentations 3:22-23", text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness." },
  ],
  strength: [
    { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
    { ref: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you." },
    { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
    { ref: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble." },
    { ref: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
  ],
  love: [
    { ref: "1 Corinthians 13:4-7", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud." },
    { ref: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
    { ref: "Romans 8:38-39", text: "For I am convinced that neither death nor life, neither angels nor demons, can separate us from the love of God." },
    { ref: "1 John 4:19", text: "We love because he first loved us." },
    { ref: "Psalm 136:26", text: "Give thanks to the God of heaven. His love endures forever." },
  ],
  peace: [
    { ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God will guard your hearts and minds." },
    { ref: "John 14:27", text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled." },
    { ref: "Isaiah 26:3", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you." },
    { ref: "Psalm 29:11", text: "The Lord gives strength to his people; the Lord blesses his people with peace." },
    { ref: "Colossians 3:15", text: "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace." },
  ],
  gratitude: [
    { ref: "Psalm 100:4", text: "Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name." },
    { ref: "1 Thessalonians 5:18", text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus." },
    { ref: "Colossians 3:17", text: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him." },
    { ref: "Psalm 107:1", text: "Give thanks to the Lord, for he is good; his love endures forever." },
    { ref: "James 1:17", text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights." },
  ],
};

interface GeneratedSong {
  title: string;
  audioUrl: string;
  coverUrl: string;
  theme: string;
}

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

export default function CreateGospelGreeting() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("encouragement");
  const [eventInfo, setEventInfo] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["gospel", "soul"]);
  const [selectedRapStyle, setSelectedRapStyle] = useState<string>("conscious-rap");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [songs, setSongs] = useState<GeneratedSong[]>([]);
  const [shareLink, setShareLink] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Bible verse state
  const [includeBibleVerse, setIncludeBibleVerse] = useState(false);
  const [selectedVerseTheme, setSelectedVerseTheme] = useState<string>("faith");
  const [selectedVerse, setSelectedVerse] = useState<{ ref: string; text: string } | null>(null);
  const [verseSearch, setVerseSearch] = useState("");
  const [verseInputMode, setVerseInputMode] = useState<"select" | "custom">("select");
  const [customVerseRef, setCustomVerseRef] = useState("");
  const [customVerseText, setCustomVerseText] = useState("");
  
  // Get all verses for search
  const allVerses = Object.entries(bibleVerses).flatMap(([theme, verses]) => 
    verses.map(v => ({ ...v, theme }))
  );
  
  // Filter verses based on search
  const filteredVerses = verseSearch 
    ? allVerses.filter(v => 
        v.ref.toLowerCase().includes(verseSearch.toLowerCase()) || 
        v.text.toLowerCase().includes(verseSearch.toLowerCase())
      )
    : bibleVerses[selectedVerseTheme as keyof typeof bibleVerses] || [];

  const themes = [
    { id: "faith", label: "Faith & Trust" },
    { id: "hope", label: "Hope & Strength" },
  ];

  const occasions = [
    { value: "encouragement", label: "Encouragement" },
    { value: "healing", label: "Healing & Recovery" },
    { value: "celebration", label: "Celebration" },
    { value: "comfort", label: "Comfort & Peace" },
    { value: "gratitude", label: "Gratitude & Thanks" },
  ];

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const handlePlayPause = (idx: number, audioUrl: string) => {
    if (!audioUrl) {
      toast({
        title: "Audio Not Available",
        description: "This song's audio is still processing.",
        variant: "destructive",
      });
      return;
    }

    if (playingIndex === idx) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      audioRef.current?.pause();
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
        toast({
          title: "Playback Error",
          description: "Unable to play the audio. Please try again.",
          variant: "destructive",
        });
      });
      audioRef.current.onended = () => setPlayingIndex(null);
      setPlayingIndex(idx);
    }
  };

  if (!isAuthenticated) {
    setLocation('/auth?returnTo=/experience/gospel-greeting/create');
    return null;
  }

  const handleGenerate = async () => {
    if (!recipientName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the recipient's name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedGenres.length === 0) {
      toast({
        title: "Genre Required",
        description: "Please select at least one genre.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCurrentStep(1);

    try {
      for (let i = 0; i < 2; i++) {
        setCurrentStep(i + 1);
        let genre = selectedGenres[i % selectedGenres.length];
        // Use specific rap sub-genre when rap is selected
        if (genre === 'rap' && selectedRapStyle) {
          const rapLabel = rapSubGenres.find(r => r.id === selectedRapStyle)?.label || 'Rap';
          genre = `${rapLabel} Rap`;
        }
        
        // Build custom message with Bible verse if selected
        let customMessage: string;
        const verseToUse = verseInputMode === "custom" && customVerseText.trim()
          ? { ref: customVerseRef || "Scripture", text: customVerseText }
          : selectedVerse;
        
        if (includeBibleVerse && verseToUse) {
          // Bible verse mode: sing the verse word-for-word as the lyrics
          customMessage = `Create a song for ${recipientName} where the MAIN LYRICS are the Bible verse ${verseToUse.ref}. The verse must be sung WORD-FOR-WORD as the primary lyrics: "${verseToUse.text}". This scripture should be the centerpiece of the song, repeated and sung clearly. Theme: ${themes[i].label.toLowerCase()}.${eventInfo ? ` Context: ${eventInfo}` : ''}`;
        } else {
          // Regular gospel message mode
          customMessage = `A ${themes[i].label.toLowerCase()} gospel message for ${recipientName}`;
          if (eventInfo) {
            customMessage += `. Event details: ${eventInfo}`;
          }
        }
        
        const response = await apiRequest('POST', '/api/creations', {
          type: 'song',
          recipientName: recipientName,
          occasion: occasion,
          tone: 'spiritual',
          genre: genre,
          voiceType: 'soulful',
          customMessage: customMessage,
        });
        
        const initialCreation = await response.json();
        const completedCreation = await pollForCompletion(initialCreation.id);
        
        setSongs(prev => [...prev, {
          title: completedCreation.title || `${themes[i].label} Gospel Song`,
          audioUrl: completedCreation.mediaUrl || '',
          coverUrl: completedCreation.imageUrl || '',
          theme: themes[i].label,
        }]);
      }

      setCurrentStep(3);
      setShareLink(`${window.location.origin}/share/gospel-${Date.now()}`);
      
      toast({
        title: "Gospel Greeting Created!",
        description: "Your uplifting messages are ready to share.",
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
      description: "Share this blessing with your loved one.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Church className="w-8 h-8 text-purple-500" />
          </div>
          <Badge className="mb-2 bg-purple-500">Gospel Greeting Experience</Badge>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Your Gospel Greeting
          </h1>
          <p className="text-muted-foreground mt-2">2 uplifting songs with soulful vocals</p>
        </div>

        {currentStep === 0 && (
          <Card className="max-w-xl mx-auto border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Enter Details
              </CardTitle>
              <CardDescription>Create a spiritually uplifting message for someone special</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient's Name</Label>
                <Input
                  id="recipientName"
                  placeholder="Enter their name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  data-testid="input-recipient-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger data-testid="select-occasion">
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((occ) => (
                      <SelectItem key={occ.value} value={occ.value}>
                        {occ.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventInfo">Event Details (optional)</Label>
                <Textarea
                  id="eventInfo"
                  placeholder="Add details about the occasion (e.g., church event, what they're going through, special message...)"
                  value={eventInfo}
                  onChange={(e) => setEventInfo(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-event-info"
                />
              </div>

              <div className="space-y-3">
                <Label>Select Genres</Label>
                <div className="grid grid-cols-2 gap-3">
                  {gospelGenres.map((genre) => (
                    <div key={genre.id} className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={() => handleGenreToggle(genre.id)}
                          data-testid={`checkbox-genre-${genre.id}`}
                        />
                        <label
                          htmlFor={`genre-${genre.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {genre.label}
                        </label>
                      </div>
                      {genre.id === "rap" && selectedGenres.includes("rap") && (
                        <Select value={selectedRapStyle} onValueChange={setSelectedRapStyle}>
                          <SelectTrigger className="h-8 text-xs ml-6" data-testid="select-rap-style">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            {rapSubGenres.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
                {selectedGenres.length === 0 && (
                  <p className="text-xs text-destructive">Please select at least one genre</p>
                )}
              </div>

              {/* Bible Verse Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <Label htmlFor="include-verse">Sing a Bible Verse</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">The verse will be sung word-for-word as the main lyrics</p>
                  </div>
                  <Switch
                    id="include-verse"
                    checked={includeBibleVerse}
                    onCheckedChange={setIncludeBibleVerse}
                    data-testid="switch-include-verse"
                  />
                </div>
                
                {includeBibleVerse && (
                  <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    {/* Toggle between select and custom */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={verseInputMode === "select" ? "default" : "outline"}
                        onClick={() => setVerseInputMode("select")}
                        className={verseInputMode === "select" ? "bg-purple-500 hover:bg-purple-600" : ""}
                        data-testid="button-verse-mode-select"
                      >
                        Choose from list
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={verseInputMode === "custom" ? "default" : "outline"}
                        onClick={() => setVerseInputMode("custom")}
                        className={verseInputMode === "custom" ? "bg-purple-500 hover:bg-purple-600" : ""}
                        data-testid="button-verse-mode-custom"
                      >
                        Enter my own
                      </Button>
                    </div>
                    
                    {verseInputMode === "select" ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search verses..."
                            value={verseSearch}
                            onChange={(e) => setVerseSearch(e.target.value)}
                            className="pl-9"
                            data-testid="input-verse-search"
                          />
                        </div>
                        
                        {!verseSearch && (
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(bibleVerses).map((theme) => (
                              <Badge
                                key={theme}
                                variant={selectedVerseTheme === theme ? "default" : "outline"}
                                className={`cursor-pointer capitalize ${selectedVerseTheme === theme ? 'bg-purple-500' : ''}`}
                                onClick={() => {
                                  setSelectedVerseTheme(theme);
                                  setSelectedVerse(null);
                                }}
                                data-testid={`badge-theme-${theme}`}
                              >
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <ScrollArea className="h-48">
                          <div className="space-y-2 pr-4">
                            {filteredVerses.map((verse, idx) => (
                              <div
                                key={`${verse.ref}-${idx}`}
                                onClick={() => setSelectedVerse({ ref: verse.ref, text: verse.text })}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedVerse?.ref === verse.ref
                                    ? 'bg-purple-200 dark:bg-purple-800 border-purple-400'
                                    : 'bg-white dark:bg-gray-900 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                } border`}
                                data-testid={`verse-${verse.ref.replace(/[:\s]/g, '-')}`}
                              >
                                <p className="font-medium text-sm text-purple-600 dark:text-purple-400">
                                  {verse.ref}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {verse.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        {selectedVerse && (
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Selected verse:</p>
                            <p className="font-medium text-purple-600 dark:text-purple-400">{selectedVerse.ref}</p>
                            <p className="text-sm italic">"{selectedVerse.text}"</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Quick-fill popular passages:</Label>
                          <div className="flex flex-wrap gap-2">
                            {popularPassages.map((passage) => (
                              <Badge
                                key={passage.ref}
                                variant="outline"
                                className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50"
                                onClick={() => {
                                  setCustomVerseRef(passage.ref);
                                  setCustomVerseText(passage.text);
                                }}
                                data-testid={`badge-passage-${passage.ref.replace(/[:\s]/g, '-')}`}
                              >
                                {passage.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-verse-ref">Verse Reference (optional)</Label>
                          <Input
                            id="custom-verse-ref"
                            placeholder="e.g., John 3:16 or Psalm 23"
                            value={customVerseRef}
                            onChange={(e) => setCustomVerseRef(e.target.value)}
                            data-testid="input-custom-verse-ref"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-verse-text">Verse Text <span className="text-destructive">*</span></Label>
                          <Textarea
                            id="custom-verse-text"
                            placeholder="Enter the verse text to be sung..."
                            value={customVerseText}
                            onChange={(e) => setCustomVerseText(e.target.value)}
                            className="min-h-[100px] resize-none"
                            data-testid="input-custom-verse-text"
                          />
                          <p className="text-xs text-muted-foreground">This text will be sung word-for-word as the lyrics</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Your greeting will include:</p>
                <div className="space-y-2">
                  {themes.map((theme, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{theme.label}</span>
                      <span className="text-muted-foreground">gospel message</span>
                    </div>
                  ))}
                  {includeBibleVerse && (verseInputMode === "select" ? selectedVerse : customVerseText.trim()) && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-purple-200 dark:border-purple-700 mt-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">
                        {verseInputMode === "select" ? selectedVerse?.ref : (customVerseRef || "Custom verse")}
                      </span>
                      <span className="text-muted-foreground">sung word-for-word</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={handleGenerate}
                disabled={generating || selectedGenres.length === 0}
                data-testid="button-generate-songs"
              >
                <Church className="w-4 h-4 mr-2" />
                Generate Gospel Greeting
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card className="max-w-xl mx-auto border-purple-200 dark:border-purple-800">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creating Your Gospel Greeting</h3>
              <p className="text-muted-foreground mb-6">
                Generating message {currentStep} of 2: {themes[currentStep - 1]?.label || ''}
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step < currentStep ? 'bg-purple-500' : 
                      step === currentStep ? 'bg-purple-500 animate-pulse' : 
                      'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && songs.length > 0 && (
          <div className="space-y-6">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Gospel Greeting Ready!</CardTitle>
                <CardDescription>Share this blessing with {recipientName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30"
                    >
                      <div className="w-16 h-16 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center overflow-hidden">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Church className="w-8 h-8 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-muted-foreground">{song.theme}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handlePlayPause(idx, song.audioUrl)}
                        data-testid={`button-play-${idx}`}
                      >
                        {playingIndex === idx ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
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
                  <Button onClick={handleShare} className="bg-purple-500 hover:bg-purple-600" data-testid="button-copy-link">
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
