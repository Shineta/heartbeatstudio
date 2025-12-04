import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Music, Mail, ArrowLeft, Heart, Loader2, Edit, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LovedOne, Creation } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface LyricsPreview {
  lyrics: string;
  title: string;
  description: string;
}

const cardFormSchema = z.object({
  lovedOneId: z.string().optional(),
  recipientName: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
  style: z.string().min(1, "Style is required"),
});

const songFormSchema = z.object({
  lovedOneId: z.string().optional(),
  recipientName: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
  genre: z.string().min(1, "Genre is required"),
  additionalNotes: z.string().optional(),
});

const animationFormSchema = z.object({
  lovedOneId: z.string().optional(),
  recipientName: z.string().min(1, "Name is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
  style: z.string().optional(),
  description: z.string().optional(),
});

export default function CreatePage() {
  const { toast } = useToast();
  const [createdCard, setCreatedCard] = useState<Creation | null>(null);
  const [createdSong, setCreatedSong] = useState<Creation | null>(null);
  const [createdAnimation, setCreatedAnimation] = useState<Creation | null>(null);
  const [songGenerationTime, setSongGenerationTime] = useState(0);
  
  // Lyrics preview state
  const [lyricsPreview, setLyricsPreview] = useState<LyricsPreview | null>(null);
  const [editedLyrics, setEditedLyrics] = useState<string>("");
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [pendingSongData, setPendingSongData] = useState<z.infer<typeof songFormSchema> | null>(null);

  const { data: lovedOnes = [] } = useQuery<LovedOne[]>({
    queryKey: ['/api/loved-ones'],
  });

  const cardForm = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      recipientName: "",
      relationship: "",
      occasion: "",
      tone: "sweet",
      style: "watercolor",
    },
  });

  const songForm = useForm<z.infer<typeof songFormSchema>>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      recipientName: "",
      relationship: "",
      occasion: "",
      tone: "sweet",
      genre: "pop",
      additionalNotes: "",
    },
  });

  const animationForm = useForm<z.infer<typeof animationFormSchema>>({
    resolver: zodResolver(animationFormSchema),
    defaultValues: {
      recipientName: "",
      occasion: "",
      tone: "sweet",
      style: "",
      description: "",
    },
  });

  const cardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof cardFormSchema>) => {
      const res = await apiRequest("POST", "/api/generate/card", data);
      return await res.json() as Creation;
    },
    onSuccess: (data: Creation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      setCreatedCard(data);
      toast({ title: "Success", description: "Your card has been created!" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const animationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof animationFormSchema>) => {
      const res = await apiRequest("POST", "/api/generate/animation", data);
      return await res.json() as Creation;
    },
    onSuccess: (data: Creation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      setCreatedAnimation(data);
      toast({ title: "Success", description: "Your animation has been created!" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create animation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate lyrics preview only (fast)
  const lyricsPreviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof songFormSchema>) => {
      const res = await apiRequest("POST", "/api/generate/lyrics-preview", data);
      return await res.json() as LyricsPreview;
    },
    onSuccess: (data: LyricsPreview, variables) => {
      setLyricsPreview(data);
      setEditedLyrics(data.lyrics);
      setEditedTitle(data.title);
      setPendingSongData(variables);
      toast({ title: "Lyrics Ready!", description: "Review and edit your lyrics before creating the song." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate lyrics. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create song with custom/edited lyrics
  const songWithLyricsMutation = useMutation({
    mutationFn: async (data: { lovedOneId?: string; tone: string; genre: string; title: string; lyrics: string; additionalNotes?: string }) => {
      const res = await apiRequest("POST", "/api/generate/song-with-lyrics", data);
      return await res.json() as Creation;
    },
    onSuccess: (data: Creation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      setCreatedSong(data);
      setLyricsPreview(null);
      setPendingSongData(null);
      setEditedLyrics("");
      setEditedTitle("");
      setSongGenerationTime(0);
      toast({ title: "Success", description: "Your song has been created!" });
    },
    onError: (error: Error) => {
      setSongGenerationTime(0);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message || "Unknown error occurred";
      toast({
        title: "Song Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const songMutation = useMutation({
    mutationFn: async (data: z.infer<typeof songFormSchema>) => {
      const res = await apiRequest("POST", "/api/generate/song", data);
      return await res.json() as Creation;
    },
    onSuccess: (data: Creation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      setCreatedSong(data);
      setPendingSongData(null);
      setSongGenerationTime(0);
      toast({ title: "Success", description: "Your song has been created!" });
    },
    onError: (error: Error) => {
      setSongGenerationTime(0);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message || "Unknown error occurred";
      toast({
        title: "Song Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isPending = songMutation.isPending || songWithLyricsMutation.isPending;
    if (isPending) {
      setSongGenerationTime(0);
      interval = setInterval(() => {
        setSongGenerationTime(prev => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [songMutation.isPending, songWithLyricsMutation.isPending]);

  const onCardSubmit = (data: z.infer<typeof cardFormSchema>) => {
    cardMutation.mutate(data);
  };

  const onAnimationSubmit = (data: z.infer<typeof animationFormSchema>) => {
    animationMutation.mutate(data);
  };

  // Generate lyrics preview first
  const onGenerateLyrics = (data: z.infer<typeof songFormSchema>) => {
    lyricsPreviewMutation.mutate(data);
  };

  // Create song with the edited lyrics
  const onCreateSongWithLyrics = () => {
    if (!pendingSongData || !editedLyrics || !editedTitle) return;
    
    songWithLyricsMutation.mutate({
      lovedOneId: pendingSongData.lovedOneId,
      tone: pendingSongData.tone,
      genre: pendingSongData.genre,
      title: editedTitle,
      lyrics: editedLyrics,
      additionalNotes: pendingSongData.additionalNotes,
    });
  };

  // Regenerate lyrics with same data
  const onRegenerateLyrics = () => {
    if (pendingSongData) {
      lyricsPreviewMutation.mutate(pendingSongData);
    }
  };

  // Go back to form from lyrics preview
  const onBackToForm = () => {
    setLyricsPreview(null);
    setPendingSongData(null);
    setEditedLyrics("");
    setEditedTitle("");
  };

  const onSongSubmit = (data: z.infer<typeof songFormSchema>) => {
    songMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/dashboard"}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Something Special
          </h1>
          <p className="text-lg text-muted-foreground">
            Let AI help you express your feelings
          </p>
        </div>

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="card" data-testid="tab-card">
              <Mail className="w-4 h-4 mr-2" />
              Greeting Card
            </TabsTrigger>
            <TabsTrigger value="animation" data-testid="tab-animation">
              <Sparkles className="w-4 h-4 mr-2" />
              Animation
            </TabsTrigger>
            <TabsTrigger value="song" data-testid="tab-song">
              <Music className="w-4 h-4 mr-2" />
              Song
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            {createdCard ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{createdCard.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {createdCard.imageUrl && (
                      <img
                        src={createdCard.imageUrl}
                        alt={createdCard.title || "Card"}
                        className="w-full rounded-md"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{createdCard.content}</p>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button onClick={() => setCreatedCard(null)} variant="outline">
                      Create Another
                    </Button>
                    <Button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${createdCard.shareableLink}`);
                      toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                    }}>
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Greeting Card Creator
                  </CardTitle>
                  <CardDescription>
                    Create a personalized greeting card with AI-generated messages and images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...cardForm}>
                    <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-6">
                      <FormField
                        control={cardForm.control}
                        name="lovedOneId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Loved One (optional)</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const loved = lovedOnes.find(l => l.id === value);
                                  if (loved) {
                                    cardForm.setValue("recipientName", loved.name);
                                    cardForm.setValue("relationship", loved.relationship);
                                  }
                                }}
                                value={field.value}
                              >
                                <SelectTrigger data-testid="select-card-loved-one">
                                  <SelectValue placeholder="Choose from your loved ones" />
                                </SelectTrigger>
                                <SelectContent>
                                  {lovedOnes.map((loved) => (
                                    <SelectItem key={loved.id} value={loved.id}>
                                      {loved.name} ({loved.relationship})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Sarah" {...field} data-testid="input-card-recipient" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input placeholder="Best Friend" {...field} data-testid="input-card-relationship" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="occasion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occasion</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-card-occasion">
                                  <SelectValue placeholder="Select occasion" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="birthday">Birthday</SelectItem>
                                  <SelectItem value="anniversary">Anniversary</SelectItem>
                                  <SelectItem value="graduation">Graduation</SelectItem>
                                  <SelectItem value="thank-you">Thank You</SelectItem>
                                  <SelectItem value="get-well">Get Well Soon</SelectItem>
                                  <SelectItem value="congratulations">Congratulations</SelectItem>
                                  <SelectItem value="love">Love</SelectItem>
                                  <SelectItem value="friendship">Friendship</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tone</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-card-tone">
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sweet">Sweet</SelectItem>
                                  <SelectItem value="funny">Funny</SelectItem>
                                  <SelectItem value="romantic">Romantic</SelectItem>
                                  <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                  <SelectItem value="playful">Playful</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="style"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Style</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-card-style">
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="watercolor">Watercolor</SelectItem>
                                  <SelectItem value="minimalist">Minimalist</SelectItem>
                                  <SelectItem value="vintage">Vintage</SelectItem>
                                  <SelectItem value="modern">Modern</SelectItem>
                                  <SelectItem value="floral">Floral</SelectItem>
                                  <SelectItem value="illustrated">Illustrated</SelectItem>
                                  <SelectItem value="elegant">Elegant</SelectItem>
                                  <SelectItem value="whimsical">Whimsical</SelectItem>
                                  <SelectItem value="photo-realistic">Photo Realistic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={cardMutation.isPending} data-testid="button-generate-card">
                        {cardMutation.isPending ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating Magic...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2 heartbeat" />
                            Generate Card
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="animation">
            {createdAnimation ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{createdAnimation.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {createdAnimation.imageUrl && (
                      <img
                        src={createdAnimation.imageUrl}
                        alt={createdAnimation.title || "Animation"}
                        className="w-full rounded-md"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{createdAnimation.content}</p>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button onClick={() => setCreatedAnimation(null)} variant="outline" data-testid="button-create-another-animation">
                      Create Another
                    </Button>
                    <Button onClick={() => {
                      const shareLink = createdAnimation.shareableLink?.startsWith('/share/')
                        ? createdAnimation.shareableLink
                        : `/share/${createdAnimation.shareableLink}`;
                      navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                      toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                    }} data-testid="button-share-animation">
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Animation Creator
                  </CardTitle>
                  <CardDescription>
                    Create a personalized celebration animation with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...animationForm}>
                    <form onSubmit={animationForm.handleSubmit(onAnimationSubmit)} className="space-y-6">
                      <FormField
                        control={animationForm.control}
                        name="lovedOneId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Loved One (optional)</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const loved = lovedOnes.find(l => l.id === value);
                                  if (loved) {
                                    animationForm.setValue("recipientName", loved.name);
                                  }
                                }}
                                value={field.value}
                              >
                                <SelectTrigger data-testid="select-animation-loved-one">
                                  <SelectValue placeholder="Choose from your loved ones" />
                                </SelectTrigger>
                                <SelectContent>
                                  {lovedOnes.map((loved) => (
                                    <SelectItem key={loved.id} value={loved.id}>
                                      {loved.name} ({loved.relationship})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={animationForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Sarah" {...field} data-testid="input-animation-recipient" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={animationForm.control}
                        name="occasion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occasion</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-animation-occasion">
                                  <SelectValue placeholder="Select an occasion" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="birthday">Birthday</SelectItem>
                                  <SelectItem value="anniversary">Anniversary</SelectItem>
                                  <SelectItem value="graduation">Graduation</SelectItem>
                                  <SelectItem value="wedding">Wedding</SelectItem>
                                  <SelectItem value="new_baby">New Baby</SelectItem>
                                  <SelectItem value="promotion">Promotion</SelectItem>
                                  <SelectItem value="thank_you">Thank You</SelectItem>
                                  <SelectItem value="congratulations">Congratulations</SelectItem>
                                  <SelectItem value="holiday">Holiday</SelectItem>
                                  <SelectItem value="just_because">Just Because</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={animationForm.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tone</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-animation-tone">
                                  <SelectValue placeholder="Select a tone" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sweet">Sweet</SelectItem>
                                  <SelectItem value="funny">Funny</SelectItem>
                                  <SelectItem value="romantic">Romantic</SelectItem>
                                  <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                  <SelectItem value="playful">Playful</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={animationForm.control}
                        name="style"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animation Style (optional)</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-animation-style">
                                  <SelectValue placeholder="Select a style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cartoon">Cartoon</SelectItem>
                                  <SelectItem value="anime">Anime</SelectItem>
                                  <SelectItem value="3d">3D Rendered</SelectItem>
                                  <SelectItem value="watercolor">Watercolor</SelectItem>
                                  <SelectItem value="pixar">Pixar Style</SelectItem>
                                  <SelectItem value="realistic">Realistic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={animationForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scene Description (optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what you'd like in the animation (e.g., 'Balloons flying, confetti falling, a birthday cake with candles')"
                                {...field}
                                data-testid="input-animation-description"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={animationMutation.isPending} data-testid="button-generate-animation">
                        {animationMutation.isPending ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating Animation...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2 heartbeat" />
                            Generate Animation
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="song">
            {createdSong ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{createdSong.title}</CardTitle>
                    {createdSong.genre && (
                      <CardDescription>Genre: {createdSong.genre}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {createdSong.imageUrl && (
                      <img
                        src={createdSong.imageUrl}
                        alt={createdSong.title || "Song cover"}
                        className="w-full rounded-md"
                      />
                    )}
                    {createdSong.mediaUrl && (
                      <div className="w-full">
                        <audio controls className="w-full" data-testid="audio-player">
                          <source src={createdSong.mediaUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold mb-2">Lyrics:</h3>
                      <p className="whitespace-pre-wrap text-muted-foreground">{createdSong.content}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button onClick={() => setCreatedSong(null)} variant="outline" data-testid="button-create-another">
                      Create Another
                    </Button>
                    <Button onClick={() => {
                      const shareLink = createdSong.shareableLink?.startsWith('/share/') 
                        ? createdSong.shareableLink 
                        : `/share/${createdSong.shareableLink}`;
                      navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                      toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                    }} data-testid="button-share">
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : lyricsPreview ? (
              /* Lyrics Preview Step */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-primary" />
                    Review Your Lyrics
                  </CardTitle>
                  <CardDescription>
                    Edit the lyrics below if you'd like, then create your song!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Song Title</label>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Song title"
                      data-testid="input-edit-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lyrics</label>
                    <Textarea
                      value={editedLyrics}
                      onChange={(e) => setEditedLyrics(e.target.value)}
                      placeholder="Song lyrics"
                      className="min-h-[300px] font-mono text-sm"
                      data-testid="textarea-edit-lyrics"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Use [Verse], [Chorus], [Bridge] tags to structure your song
                    </p>
                  </div>

                  {lyricsPreview.description && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground italic">
                        "{lyricsPreview.description}"
                      </p>
                    </div>
                  )}

                  {(songWithLyricsMutation.isPending) && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <div className="text-center">
                            <p className="font-semibold text-lg">Creating Your 3-Minute Song...</p>
                            <p className="text-sm text-muted-foreground">
                              {songGenerationTime < 60 
                                ? "Starting the music studio..."
                                : songGenerationTime < 180
                                ? "Creating initial track with vocals and music..."
                                : songGenerationTime < 360
                                ? "Extending song to full length... This takes time for quality!"
                                : songGenerationTime < 540
                                ? "Almost there! Finalizing your 3-minute masterpiece..."
                                : "Taking longer than usual... Please be patient, great music takes time!"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time elapsed</span>
                            <span className="font-medium">{Math.floor(songGenerationTime / 60)}:{(songGenerationTime % 60).toString().padStart(2, '0')}</span>
                          </div>
                          <Progress value={Math.min((songGenerationTime / 600) * 100, 95)} className="h-2" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          Extended songs (3 min) typically take 5-10 minutes to generate
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={onBackToForm}
                    disabled={songWithLyricsMutation.isPending}
                    data-testid="button-back-to-form"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRegenerateLyrics}
                    disabled={lyricsPreviewMutation.isPending || songWithLyricsMutation.isPending}
                    data-testid="button-regenerate-lyrics"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${lyricsPreviewMutation.isPending ? 'animate-spin' : ''}`} />
                    {lyricsPreviewMutation.isPending ? 'Regenerating...' : 'Regenerate Lyrics'}
                  </Button>
                  <Button
                    onClick={onCreateSongWithLyrics}
                    disabled={songWithLyricsMutation.isPending || !editedLyrics || !editedTitle}
                    className="flex-1"
                    data-testid="button-create-song"
                  >
                    {songWithLyricsMutation.isPending ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Creating Song...
                      </>
                    ) : (
                      <>
                        <Music className="w-4 h-4 mr-2" />
                        Create Song with These Lyrics
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Song Creator
                  </CardTitle>
                  <CardDescription>
                    Create a personalized song with AI-generated lyrics and cover art
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-start gap-2">
                      <Music className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Song Length:</span> Each song is approximately 3 minutes long with full vocals and music.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Loader2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Generation Time:</span> Songs take 5-10 minutes to create due to the extended length. Please be patient while our AI composes your unique track.
                      </p>
                    </div>
                  </div>
                  <Form {...songForm}>
                    <form onSubmit={songForm.handleSubmit(onGenerateLyrics)} className="space-y-6">
                      <FormField
                        control={songForm.control}
                        name="lovedOneId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Loved One (optional)</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const loved = lovedOnes.find(l => l.id === value);
                                  if (loved) {
                                    songForm.setValue("recipientName", loved.name);
                                    songForm.setValue("relationship", loved.relationship);
                                  }
                                }}
                                value={field.value}
                              >
                                <SelectTrigger data-testid="select-song-loved-one">
                                  <SelectValue placeholder="Choose from your loved ones" />
                                </SelectTrigger>
                                <SelectContent>
                                  {lovedOnes.map((loved) => (
                                    <SelectItem key={loved.id} value={loved.id}>
                                      {loved.name} ({loved.relationship})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Sarah" {...field} data-testid="input-song-recipient" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input placeholder="Best Friend" {...field} data-testid="input-song-relationship" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="occasion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occasion</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-song-occasion">
                                  <SelectValue placeholder="Select occasion" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="birthday">Birthday</SelectItem>
                                  <SelectItem value="anniversary">Anniversary</SelectItem>
                                  <SelectItem value="graduation">Graduation</SelectItem>
                                  <SelectItem value="thank-you">Thank You</SelectItem>
                                  <SelectItem value="congratulations">Congratulations</SelectItem>
                                  <SelectItem value="love">Love</SelectItem>
                                  <SelectItem value="friendship">Friendship</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-song-genre">
                                  <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pop">Pop</SelectItem>
                                  <SelectItem value="rock">Rock</SelectItem>
                                  <SelectItem value="country">Country</SelectItem>
                                  <SelectItem value="r&b">R&B</SelectItem>
                                  <SelectItem value="rap">Rap</SelectItem>
                                  <SelectItem value="ballad">Ballad</SelectItem>
                                  <SelectItem value="gospel">Gospel</SelectItem>
                                  <SelectItem value="black-gospel">Black Gospel (Clark Sisters style)</SelectItem>
                                  <SelectItem value="christmas">Christmas</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tone</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-song-tone">
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sweet">Sweet</SelectItem>
                                  <SelectItem value="funny">Funny</SelectItem>
                                  <SelectItem value="romantic">Romantic</SelectItem>
                                  <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                  <SelectItem value="playful">Playful</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any special details to make your song unique. For example: 'This song is for a Christmas night celebration' or 'She just won a basketball game' or 'He recently lost his grandmother'"
                                className="min-h-[100px] resize-none"
                                {...field}
                                data-testid="textarea-song-notes"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Share specific moments, achievements, or situations to personalize the lyrics
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {lyricsPreviewMutation.isPending && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <div className="text-center">
                                <p className="font-semibold text-lg">Writing Lyrics...</p>
                                <p className="text-sm text-muted-foreground">
                                  AI is crafting personalized lyrics for you
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button type="submit" className="w-full" disabled={lyricsPreviewMutation.isPending} data-testid="button-generate-lyrics">
                        {lyricsPreviewMutation.isPending ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Generating Lyrics...
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Generate Lyrics Preview
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
