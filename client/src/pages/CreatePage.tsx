import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Music, Mail, ArrowLeft, Heart, Loader2, Edit, RefreshCw, ListMusic, Play, Pause, SkipBack, SkipForward, Upload, X, ImageIcon, Briefcase, Users, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LovedOne, Creation, Mixtape } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { rapSubGenres } from "@/lib/genres";

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
  subGenre: z.string().optional(),
  voice: z.string().optional(),
  duration: z.string().optional(),
  songDetails: z.string().min(10, "Please share some details about the song (at least 10 characters)"),
});

const animationFormSchema = z.object({
  lovedOneId: z.string().optional(),
  recipientName: z.string().min(1, "Name is required"),
  occasion: z.string().min(1, "Occasion is required"),
  tone: z.string().min(1, "Tone is required"),
  style: z.string().optional(),
  description: z.string().optional(),
});

const mixtapeFormSchema = z.object({
  lovedOneId: z.string().optional(),
  recipientName: z.string().min(1, "Name is required"),
  theme: z.string().min(1, "Theme is required"),
  genre1: z.string().min(1, "Genre for Song 1 is required"),
  tone1: z.string().min(1, "Tone for Song 1 is required"),
  voice1: z.string().optional(),
  duration1: z.string().optional(),
  notes1: z.string().optional(),
  customTitle1: z.string().optional(),
  customLyrics1: z.string().optional(),
  genre2: z.string().min(1, "Genre for Song 2 is required"),
  tone2: z.string().min(1, "Tone for Song 2 is required"),
  voice2: z.string().optional(),
  duration2: z.string().optional(),
  notes2: z.string().optional(),
  customTitle2: z.string().optional(),
  customLyrics2: z.string().optional(),
  genre3: z.string().min(1, "Genre for Song 3 is required"),
  tone3: z.string().min(1, "Tone for Song 3 is required"),
  voice3: z.string().optional(),
  duration3: z.string().optional(),
  notes3: z.string().optional(),
  customTitle3: z.string().optional(),
  customLyrics3: z.string().optional(),
});

export default function CreatePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createdCard, setCreatedCard] = useState<Creation | null>(null);
  const [createdSong, setCreatedSong] = useState<Creation | null>(null);
  const [createdAnimation, setCreatedAnimation] = useState<Creation | null>(null);
  const [createdMixtape, setCreatedMixtape] = useState<Mixtape | null>(null);
  const [songGenerationTime, setSongGenerationTime] = useState(0);
  const [mixtapeGenerationTime, setMixtapeGenerationTime] = useState(0);
  const [songProgress, setSongProgress] = useState(0);
  
  // Mixtape player state
  const [mixtapeSongs, setMixtapeSongs] = useState<Creation[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // AI Questionnaire state
  interface QuestionnaireData {
    intro: string;
    questions: Array<{
      id: string;
      question: string;
      hint?: string;
    }>;
  }
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [songFormData, setSongFormData] = useState<z.infer<typeof songFormSchema> | null>(null);
  
  // Lyrics preview state
  const [lyricsPreview, setLyricsPreview] = useState<LyricsPreview | null>(null);
  const [editedLyrics, setEditedLyrics] = useState<string>("");
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [pendingSongData, setPendingSongData] = useState<z.infer<typeof songFormSchema> | null>(null);
  
  // Custom cover image state
  const [customCoverImageUrl, setCustomCoverImageUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Client mode toggle (for creating songs for business clients)
  const [isClientMode, setIsClientMode] = useState(false);
  const [isMixtapeClientMode, setIsMixtapeClientMode] = useState(false);
  
  // Custom cassette cover image state for mixtapes
  const [customCassetteImageUrl, setCustomCassetteImageUrl] = useState<string | null>(null);
  const [isUploadingCassetteCover, setIsUploadingCassetteCover] = useState(false);

  const { data: lovedOnes = [] } = useQuery<LovedOne[]>({
    queryKey: ['/api/loved-ones'],
  });

  // Auto-redirect to mixtape player when generation is complete
  useEffect(() => {
    if (createdMixtape && createdMixtape.status === 'complete' && createdMixtape.shareableLink) {
      setLocation(`/share/mixtape/${createdMixtape.shareableLink}`);
    }
  }, [createdMixtape?.status, createdMixtape?.shareableLink, setLocation]);

  // Sync audio state when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      setIsPlaying(false);
      audio.pause();
      audio.load();
    }
  }, [currentSongIndex]);

  // Animate progress bar when song is generating
  useEffect(() => {
    if (createdSong?.status === 'generating') {
      setSongProgress(0);
      const interval = setInterval(() => {
        setSongProgress(prev => {
          if (prev >= 95) return prev;
          const increment = prev < 30 ? 2 : prev < 60 ? 1.5 : prev < 80 ? 0.8 : 0.3;
          return Math.min(prev + increment, 95);
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSongProgress(0);
    }
  }, [createdSong?.status]);

  // Track song polling state
  const songPollingRef = useRef<{ interval: NodeJS.Timeout | null; toastShown: boolean }>({
    interval: null,
    toastShown: false,
  });

  // Poll for song status updates when generating
  useEffect(() => {
    console.log('[SongPoll] Effect running, createdSong:', createdSong?.id, 'status:', createdSong?.status);
    
    if (!createdSong?.id || createdSong?.status !== 'generating') {
      if (songPollingRef.current.interval) {
        console.log('[SongPoll] Clearing interval - status is not generating');
        clearInterval(songPollingRef.current.interval);
        songPollingRef.current.interval = null;
      }
      return;
    }
    
    songPollingRef.current.toastShown = false;
    
    if (songPollingRef.current.interval) {
      console.log('[SongPoll] Interval already exists, skipping');
      return;
    }
    
    const songId = createdSong.id;
    console.log('[SongPoll] Starting polling for song:', songId);
    
    songPollingRef.current.interval = setInterval(async () => {
      console.log('[SongPoll] Polling for status...');
      try {
        const res = await fetch(`/api/creations/${songId}`, {
          credentials: 'include',
        });
        console.log('[SongPoll] Response status:', res.status);
        if (!res.ok) {
          console.log('[SongPoll] Response not ok, skipping');
          return;
        }
        
        const updatedSong = await res.json();
        console.log('[SongPoll] Got song status:', updatedSong.status);
        
        if (updatedSong.status === 'ready' && !songPollingRef.current.toastShown) {
          console.log('[SongPoll] Song is ready! Updating state...');
          songPollingRef.current.toastShown = true;
          setCreatedSong(updatedSong);
          setSongProgress(100);
          if (songPollingRef.current.interval) {
            clearInterval(songPollingRef.current.interval);
            songPollingRef.current.interval = null;
          }
          toast({ title: "Success", description: "Your song is ready!" });
          queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
        } else if (updatedSong.status === 'failed' && !songPollingRef.current.toastShown) {
          console.log('[SongPoll] Song failed! Updating state...');
          songPollingRef.current.toastShown = true;
          setCreatedSong(updatedSong);
          if (songPollingRef.current.interval) {
            clearInterval(songPollingRef.current.interval);
            songPollingRef.current.interval = null;
          }
          toast({ title: "Error", description: "Song generation failed. Please try again.", variant: "destructive" });
        }
      } catch (error) {
        console.error('[SongPoll] Failed to poll song status:', error);
      }
    }, 5000);
    
    return () => {
      console.log('[SongPoll] Cleanup - clearing interval');
      if (songPollingRef.current.interval) {
        clearInterval(songPollingRef.current.interval);
        songPollingRef.current.interval = null;
      }
    };
  }, [createdSong?.id, createdSong?.status, toast]);

  const handlePrevious = () => {
    setCurrentSongIndex((prev) => (prev > 0 ? prev - 1 : mixtapeSongs.length - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev < mixtapeSongs.length - 1 ? prev + 1 : 0));
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
      genre: "r&b",
      subGenre: "",
      voice: "",
      duration: "extended",
      songDetails: "",
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

  const mixtapeForm = useForm<z.infer<typeof mixtapeFormSchema>>({
    resolver: zodResolver(mixtapeFormSchema),
    defaultValues: {
      recipientName: "",
      theme: "",
      genre1: "r&b",
      tone1: "sweet",
      voice1: "",
      duration1: "extended",
      notes1: "",
      customTitle1: "",
      customLyrics1: "",
      genre2: "gospel",
      tone2: "romantic",
      voice2: "",
      duration2: "extended",
      notes2: "",
      customTitle2: "",
      customLyrics2: "",
      genre3: "neo-soul",
      tone3: "heartfelt",
      voice3: "",
      duration3: "extended",
      notes3: "",
      customTitle3: "",
      customLyrics3: "",
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

  // Generate AI questionnaire for personalized follow-up questions
  const questionnaireMutation = useMutation({
    mutationFn: async (data: z.infer<typeof songFormSchema>) => {
      const res = await apiRequest("POST", "/api/generate/questionnaire", data);
      return await res.json() as QuestionnaireData;
    },
    onSuccess: (data: QuestionnaireData, variables) => {
      setQuestionnaire(data);
      setSongFormData(variables);
      setQuestionnaireAnswers({});
      toast({ title: "Questions Ready!", description: "Answer these to make your song truly personal." });
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
        description: "Failed to generate questions. Please try again.",
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
      setQuestionnaire(null); // Clear questionnaire after lyrics are generated
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
    mutationFn: async (data: { lovedOneId?: string; tone: string; genre: string; title: string; lyrics: string; songDetails?: string; voice?: string; duration?: string; customCoverImageUrl?: string }) => {
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
      if (data.status === 'generating') {
        toast({ title: "Song Generation Started!", description: "Your song is being created. This may take 2-4 minutes. Check your dashboard to see it when ready!" });
      } else {
        toast({ title: "Success", description: "Your song has been created!" });
      }
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
      
      // Parse error message for better UX
      const errorMessage = error.message || "Unknown error occurred";
      console.log("[SongError] Full error message:", errorMessage);
      
      // Check if it's a "no songs remaining" error
      if (errorMessage.includes("No songs remaining") || errorMessage.includes("songsRemaining") || errorMessage.includes("requiresPayment")) {
        console.log("[SongError] Detected out of songs - will redirect to pricing");
        toast({
          title: "Out of Songs",
          description: "You've used all your available songs. Redirecting to get more...",
          variant: "destructive",
        });
        setTimeout(() => {
          console.log("[SongError] Redirecting now...");
          window.location.href = '/pricing';
        }, 1500);
        return;
      }
      
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
      if (data.status === 'generating') {
        toast({ title: "Song Generation Started!", description: "Your song is being created. This may take 2-4 minutes. Check your dashboard to see it when ready!" });
      } else {
        toast({ title: "Success", description: "Your song has been created!" });
      }
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
      
      // Parse error message for better UX
      const errorMessage = error.message || "Unknown error occurred";
      console.log("[SongError] Full error message:", errorMessage);
      
      // Check if it's a "no songs remaining" error
      if (errorMessage.includes("No songs remaining") || errorMessage.includes("songsRemaining") || errorMessage.includes("requiresPayment")) {
        console.log("[SongError] Detected out of songs - will redirect to pricing");
        toast({
          title: "Out of Songs",
          description: "You've used all your available songs. Redirecting to get more...",
          variant: "destructive",
        });
        setTimeout(() => {
          console.log("[SongError] Redirecting now...");
          window.location.href = '/pricing';
        }, 1500);
        return;
      }
      
      toast({
        title: "Song Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const mixtapeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mixtapeFormSchema> & { customCassetteImageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/generate/mixtape", data);
      const result = await res.json() as { mixtape: Mixtape; status?: string; message?: string };
      return result.mixtape;
    },
    onSuccess: (data: Mixtape) => {
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes'] });
      setCreatedMixtape(data);
      // Don't reset timer or show success if still generating - polling will handle it
      if (data.status === 'generating') {
        toast({ title: "Started", description: "Your mixtape is being created! This may take a few minutes." });
      } else {
        setMixtapeGenerationTime(0);
        toast({ title: "Success", description: "Your mixtape has been created!" });
      }
    },
    onError: (error: Error) => {
      setMixtapeGenerationTime(0);
      
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
        title: "Mixtape Generation Failed",
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

  // Timer for mixtape generation (runs during pending or generating status)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isGenerating = mixtapeMutation.isPending || createdMixtape?.status === 'generating';
    
    if (isGenerating) {
      // Only reset timer when mutation starts (isPending becomes true)
      if (mixtapeMutation.isPending && mixtapeGenerationTime === 0) {
        setMixtapeGenerationTime(0);
      }
      interval = setInterval(() => {
        setMixtapeGenerationTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mixtapeMutation.isPending, createdMixtape?.status]);

  // Track polling state across renders to prevent duplicates
  const pollingRef = useRef<{ interval: NodeJS.Timeout | null; toastShown: boolean }>({
    interval: null,
    toastShown: false,
  });

  // Poll for mixtape status updates when generating
  useEffect(() => {
    // Only poll if status is 'generating'
    if (!createdMixtape?.id || createdMixtape?.status !== 'generating') {
      // Clean up any existing interval when not generating
      if (pollingRef.current.interval) {
        clearInterval(pollingRef.current.interval);
        pollingRef.current.interval = null;
      }
      return;
    }
    
    // Reset toast flag when starting to poll for a new mixtape
    pollingRef.current.toastShown = false;
    
    // Don't create new interval if one already exists
    if (pollingRef.current.interval) {
      return;
    }
    
    const mixtapeId = createdMixtape.id;
    
    pollingRef.current.interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mixtapes/${mixtapeId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        
        const data = await res.json() as { mixtape: Mixtape; songs: Creation[] };
        
        setCreatedMixtape(data.mixtape);
        if (data.songs && data.songs.length > 0) {
          setMixtapeSongs(data.songs);
        }
        
        // Stop polling and show toast when no longer generating (only once)
        if (data.mixtape.status === 'complete' && !pollingRef.current.toastShown) {
          pollingRef.current.toastShown = true;
          if (pollingRef.current.interval) {
            clearInterval(pollingRef.current.interval);
            pollingRef.current.interval = null;
          }
          setMixtapeGenerationTime(0);
          toast({ title: "Success", description: "Your mixtape is ready!" });
          queryClient.invalidateQueries({ queryKey: ['/api/mixtapes'] });
        } else if (data.mixtape.status === 'failed' && !pollingRef.current.toastShown) {
          pollingRef.current.toastShown = true;
          if (pollingRef.current.interval) {
            clearInterval(pollingRef.current.interval);
            pollingRef.current.interval = null;
          }
          setMixtapeGenerationTime(0);
          toast({ title: "Error", description: "Mixtape generation failed. Please try again.", variant: "destructive" });
        }
      } catch (error) {
        console.error('Failed to poll mixtape status:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => {
      if (pollingRef.current.interval) {
        clearInterval(pollingRef.current.interval);
        pollingRef.current.interval = null;
      }
    };
  }, [createdMixtape?.id, createdMixtape?.status, toast]);

  const onCardSubmit = (data: z.infer<typeof cardFormSchema>) => {
    cardMutation.mutate(data);
  };

  const onAnimationSubmit = (data: z.infer<typeof animationFormSchema>) => {
    animationMutation.mutate(data);
  };

  const onMixtapeSubmit = (data: z.infer<typeof mixtapeFormSchema>) => {
    mixtapeMutation.mutate({
      ...data,
      customCassetteImageUrl: customCassetteImageUrl || undefined,
    });
  };

  // Helper to combine genre + subGenre for rap styles
  const getEffectiveGenre = (data: z.infer<typeof songFormSchema>) => {
    if (data.genre === "rap" && data.subGenre) {
      return data.subGenre;
    }
    return data.genre;
  };

  // Step 1: Generate AI questionnaire based on initial song details
  const onGenerateQuestionnaire = (data: z.infer<typeof songFormSchema>) => {
    const effectiveGenre = getEffectiveGenre(data);
    questionnaireMutation.mutate({ ...data, genre: effectiveGenre });
  };

  // Step 2: Submit questionnaire answers and generate lyrics
  const onSubmitQuestionnaire = () => {
    if (!songFormData) return;
    
    // Combine original song details with questionnaire answers
    const answersText = Object.entries(questionnaireAnswers)
      .filter(([_, answer]) => answer.trim())
      .map(([id, answer]) => {
        const question = questionnaire?.questions.find(q => q.id === id);
        return question ? `Q: ${question.question}\nA: ${answer}` : answer;
      })
      .join('\n\n');
    
    // Append questionnaire answers to song details for more personalized lyrics
    const enhancedSongDetails = `${songFormData.songDetails}\n\n--- Additional Context from Questionnaire ---\n${answersText}`;
    
    lyricsPreviewMutation.mutate({
      ...songFormData,
      songDetails: enhancedSongDetails,
    });
  };

  // Skip questionnaire and generate lyrics directly
  const onSkipQuestionnaire = () => {
    if (!songFormData) return;
    lyricsPreviewMutation.mutate(songFormData);
  };

  // Go back to form from questionnaire
  const onBackFromQuestionnaire = () => {
    setQuestionnaire(null);
    setSongFormData(null);
    setQuestionnaireAnswers({});
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
      songDetails: pendingSongData.songDetails,
      voice: pendingSongData.voice,
      duration: pendingSongData.duration,
      customCoverImageUrl: customCoverImageUrl || undefined,
    });
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCover(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/cover-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setCustomCoverImageUrl(data.imageUrl);
      toast({
        title: "Image uploaded",
        description: "Your custom cover image is ready",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const clearCustomCoverImage = () => {
    setCustomCoverImageUrl(null);
  };

  // Handle cassette cover image upload for mixtapes
  const handleCassetteCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCassetteCover(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/cover-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setCustomCassetteImageUrl(data.imageUrl);
      toast({
        title: "Image uploaded",
        description: "Your custom cassette cover is ready",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCassetteCover(false);
    }
  };

  const clearCustomCassetteCover = () => {
    setCustomCassetteImageUrl(null);
  };

  // Regenerate lyrics with same data
  const onRegenerateLyrics = () => {
    if (pendingSongData) {
      lyricsPreviewMutation.mutate(pendingSongData);
    }
  };

  // Go back to form from lyrics preview
  const onBackFromLyricsPreview = () => {
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="card" data-testid="tab-card">
              <Mail className="w-4 h-4 mr-2" />
              Card
            </TabsTrigger>
            <TabsTrigger value="animation" data-testid="tab-animation">
              <Sparkles className="w-4 h-4 mr-2" />
              Animation
            </TabsTrigger>
            <TabsTrigger value="song" data-testid="tab-song">
              <Music className="w-4 h-4 mr-2" />
              Song
            </TabsTrigger>
            <TabsTrigger value="mixtape" data-testid="tab-mixtape">
              <ListMusic className="w-4 h-4 mr-2" />
              Mixtape
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
                      const shareLink = createdCard.shareableLink?.startsWith('/share/')
                        ? createdCard.shareableLink
                        : `/share/${createdCard.shareableLink}`;
                      navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                      toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                    }} data-testid="button-share-card">
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
                                  <SelectItem value="missing-you">Missing You</SelectItem>
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
                                  <SelectItem value="uplifting">Uplifting</SelectItem>
                                  <SelectItem value="grateful">Grateful</SelectItem>
                                  <SelectItem value="celebratory">Celebratory</SelectItem>
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
                    {/* Video Player for Animation */}
                    {createdAnimation.mediaUrl && (
                      <video
                        controls
                        className="w-full rounded-md"
                        data-testid="video-animation-preview"
                      >
                        <source src={createdAnimation.mediaUrl} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    )}
                    {/* Fallback to image if no video */}
                    {!createdAnimation.mediaUrl && createdAnimation.imageUrl && (
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
                                  <SelectItem value="missing_you">Missing You</SelectItem>
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
                                  <SelectItem value="uplifting">Uplifting</SelectItem>
                                  <SelectItem value="grateful">Grateful</SelectItem>
                                  <SelectItem value="celebratory">Celebratory</SelectItem>
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
                    <CardTitle>{createdSong.status === 'generating' ? 'Creating Your Song...' : createdSong.title}</CardTitle>
                    {createdSong.genre && (
                      <CardDescription>Genre: {createdSong.genre}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {createdSong.status === 'generating' ? (
                      <div className="text-center py-8">
                        <div className="w-full max-w-md mx-auto mb-6">
                          <Progress value={songProgress} className="h-3" data-testid="progress-song-generation" />
                          <p className="text-sm text-muted-foreground mt-2">{Math.round(songProgress)}% complete</p>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Your song is being created!</h3>
                        <p className="text-muted-foreground mb-4">
                          This typically takes 2-4 minutes. You can check your dashboard to see when it's ready.
                        </p>
                        <Button onClick={() => setLocation('/dashboard')} variant="outline" data-testid="button-go-to-dashboard">
                          Go to Dashboard
                        </Button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button onClick={() => setCreatedSong(null)} variant="outline" data-testid="button-create-another">
                      Create Another
                    </Button>
                    {createdSong.status !== 'generating' && (
                      <Button onClick={() => {
                        const shareLink = createdSong.shareableLink?.startsWith('/share/') 
                          ? createdSong.shareableLink 
                          : `/share/${createdSong.shareableLink}`;
                        navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                        toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                      }} data-testid="button-share">
                        Share
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ) : questionnaire ? (
              /* AI Questionnaire Step */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Let's Make This Personal
                  </CardTitle>
                  <CardDescription>
                    {questionnaire.intro}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Your initial details:</span>{" "}
                      {songFormData?.songDetails}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {questionnaire.questions.map((q, index) => (
                      <div key={q.id} className="space-y-2">
                        <label className="text-sm font-medium flex items-start gap-2">
                          <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          {q.question}
                        </label>
                        {q.hint && (
                          <p className="text-xs text-muted-foreground ml-7">{q.hint}</p>
                        )}
                        <Textarea
                          value={questionnaireAnswers[q.id] || ''}
                          onChange={(e) => setQuestionnaireAnswers(prev => ({
                            ...prev,
                            [q.id]: e.target.value
                          }))}
                          placeholder="Your answer..."
                          className="min-h-[60px] resize-none ml-7"
                          data-testid={`textarea-question-${q.id}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={onBackFromQuestionnaire}
                    disabled={lyricsPreviewMutation.isPending}
                    data-testid="button-back-from-questionnaire"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onSkipQuestionnaire}
                    disabled={lyricsPreviewMutation.isPending}
                    data-testid="button-skip-questionnaire"
                  >
                    Skip Questions
                  </Button>
                  <Button
                    onClick={onSubmitQuestionnaire}
                    disabled={lyricsPreviewMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-questionnaire"
                  >
                    {lyricsPreviewMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Lyrics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Personalized Lyrics
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
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
                    onClick={onBackFromLyricsPreview}
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
                    <form onSubmit={songForm.handleSubmit(onGenerateQuestionnaire)} className="space-y-6">
                      {/* Client Mode Toggle */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          {isClientMode ? (
                            <Briefcase className="w-5 h-5 text-primary" />
                          ) : (
                            <Users className="w-5 h-5 text-primary" />
                          )}
                          <div>
                            <Label htmlFor="client-mode" className="text-sm font-medium">
                              {isClientMode ? "Creating for a Client" : "Creating for a Loved One"}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {isClientMode 
                                ? "Professional song for your business client" 
                                : "Personal song for someone special"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="client-mode"
                          checked={isClientMode}
                          onCheckedChange={(checked) => {
                            setIsClientMode(checked);
                            // Reset form fields when switching modes
                            songForm.setValue("lovedOneId", "");
                            songForm.setValue("recipientName", "");
                            songForm.setValue("relationship", checked ? "Client" : "");
                          }}
                          data-testid="switch-client-mode"
                        />
                      </div>

                      {/* Loved One Selector - only show in personal mode */}
                      {!isClientMode && (
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
                      )}

                      <FormField
                        control={songForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isClientMode ? "Client Name" : "Recipient Name"}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={isClientMode ? "John Smith" : "Sarah"} 
                                {...field} 
                                data-testid="input-song-recipient" 
                              />
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
                            <FormLabel>{isClientMode ? "Client Type" : "Relationship"}</FormLabel>
                            <FormControl>
                              {isClientMode ? (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger data-testid="select-client-type">
                                    <SelectValue placeholder="Select client type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Client">General Client</SelectItem>
                                    <SelectItem value="VIP Client">VIP Client</SelectItem>
                                    <SelectItem value="Corporate Client">Corporate Client</SelectItem>
                                    <SelectItem value="Wedding Client">Wedding Client</SelectItem>
                                    <SelectItem value="Event Client">Event Client</SelectItem>
                                    <SelectItem value="Brand Partner">Brand Partner</SelectItem>
                                    <SelectItem value="Sponsor">Sponsor</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input placeholder="Best Friend" {...field} data-testid="input-song-relationship" />
                              )}
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
                                  {isClientMode ? (
                                    <>
                                      <SelectItem value="appreciation">Client Appreciation</SelectItem>
                                      <SelectItem value="thank-you">Thank You</SelectItem>
                                      <SelectItem value="congratulations">Congratulations</SelectItem>
                                      <SelectItem value="welcome">Welcome</SelectItem>
                                      <SelectItem value="milestone">Milestone Celebration</SelectItem>
                                      <SelectItem value="partnership">Partnership Celebration</SelectItem>
                                      <SelectItem value="anniversary">Business Anniversary</SelectItem>
                                      <SelectItem value="holiday">Holiday Gift</SelectItem>
                                      <SelectItem value="wedding">Wedding</SelectItem>
                                      <SelectItem value="event">Special Event</SelectItem>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem value="birthday">Birthday</SelectItem>
                                      <SelectItem value="anniversary">Anniversary</SelectItem>
                                      <SelectItem value="graduation">Graduation</SelectItem>
                                      <SelectItem value="thank-you">Thank You</SelectItem>
                                      <SelectItem value="congratulations">Congratulations</SelectItem>
                                      <SelectItem value="love">Love</SelectItem>
                                      <SelectItem value="friendship">Friendship</SelectItem>
                                      <SelectItem value="missing-you">Missing You</SelectItem>
                                    </>
                                  )}
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
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value !== "rap") {
                                    songForm.setValue("subGenre", "");
                                  }
                                }} 
                                value={field.value}
                              >
                                <SelectTrigger data-testid="select-song-genre">
                                  <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="r&b">R&B</SelectItem>
                                  <SelectItem value="gospel">Gospel</SelectItem>
                                  <SelectItem value="black-gospel">Black Gospel (Clark Sisters style)</SelectItem>
                                  <SelectItem value="neo-soul">Neo-Soul</SelectItem>
                                  <SelectItem value="soul">Soul</SelectItem>
                                  <SelectItem value="motown">Motown</SelectItem>
                                  <SelectItem value="rap">Rap</SelectItem>
                                  <SelectItem value="hiphop">Hip-Hop</SelectItem>
                                  <SelectItem value="afrobeat">Afrobeat</SelectItem>
                                  <SelectItem value="jazz">Jazz</SelectItem>
                                  <SelectItem value="blues">Blues</SelectItem>
                                  <SelectItem value="funk">Funk</SelectItem>
                                  <SelectItem value="reggae">Reggae</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {songForm.watch("genre") === "rap" && (
                        <FormField
                          control={songForm.control}
                          name="subGenre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rap Style</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger data-testid="select-song-subgenre">
                                    <SelectValue placeholder="Select rap style (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rapSubGenres.map((subGenre) => (
                                      <SelectItem key={subGenre.id} value={subGenre.id}>
                                        {subGenre.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                                  <SelectItem value="uplifting">Uplifting</SelectItem>
                                  <SelectItem value="grateful">Grateful</SelectItem>
                                  <SelectItem value="celebratory">Celebratory</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="voice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voice (optional)</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-song-voice">
                                  <SelectValue placeholder="Any voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Voice</SelectItem>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="duet">Duet (Male & Female)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Song Length</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-song-duration">
                                  <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="quick">Quick (~1 min) - Faster generation</SelectItem>
                                  <SelectItem value="extended">Extended (~3 min) - Full song</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Quick songs generate in about 1 minute. Extended songs take 3-5 minutes but are longer.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={songForm.control}
                        name="songDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Song Details <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about the person and why you're creating this song. For example: 'Kurt is my Digital Promise coach who has been incredibly supportive this past year. He helped me get my district to adopt an app I created.'"
                                className="min-h-[100px] resize-none"
                                {...field}
                                data-testid="textarea-song-details"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Share the story behind this song - we'll ask follow-up questions to make it truly personal
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Custom Cover Image (optional)</label>
                        {customCoverImageUrl ? (
                          <div className="relative w-32 h-32">
                            <img
                              src={customCoverImageUrl}
                              alt="Custom cover"
                              className="w-full h-full object-cover rounded-lg border"
                              data-testid="img-custom-cover-preview"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
                              onClick={clearCustomCoverImage}
                              data-testid="button-clear-cover"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <label 
                              htmlFor="cover-upload"
                              className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover-elevate transition-colors"
                            >
                              {isUploadingCover ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="text-sm">Upload Image</span>
                                </>
                              )}
                            </label>
                            <input
                              id="cover-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverImageUpload}
                              disabled={isUploadingCover}
                              data-testid="input-cover-upload"
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Upload a photo to create a personalized retro cassette cover
                        </p>
                      </div>

                      {questionnaireMutation.isPending && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <div className="text-center">
                                <p className="font-semibold text-lg">Preparing Your Questions...</p>
                                <p className="text-sm text-muted-foreground">
                                  AI is analyzing your story to ask the right follow-up questions
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button type="submit" className="w-full" disabled={questionnaireMutation.isPending} data-testid="button-continue-to-questions">
                        {questionnaireMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Preparing Questions...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Continue to Questions
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mixtape">
            {createdMixtape ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListMusic className="w-5 h-5 text-primary" />
                      {createdMixtape.title}
                    </CardTitle>
                    <CardDescription>
                      Theme: {createdMixtape.theme ? createdMixtape.theme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Custom'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {createdMixtape.status === 'generating' ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-lg font-medium">Creating Your Mixtape...</p>
                        <p className="text-sm text-muted-foreground">
                          Generating 3 themed songs. This may take 15-30 minutes.
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time elapsed</span>
                            <span className="font-medium">{Math.floor(mixtapeGenerationTime / 60)}:{(mixtapeGenerationTime % 60).toString().padStart(2, '0')}</span>
                          </div>
                          <Progress value={Math.min((mixtapeGenerationTime / 1800) * 100, 95)} className="h-2" />
                        </div>
                      </div>
                    ) : createdMixtape.status === 'complete' ? (
                      <div className="space-y-6">
                        {/* Cassette Tape Visual */}
                        <div className="relative">
                          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800 rounded-xl p-4 shadow-xl border-2 border-zinc-600 dark:border-zinc-500">
                            {/* Cassette label area */}
                            <div className="bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-200 dark:to-amber-300 rounded-lg p-3 mb-4 relative overflow-hidden">
                              {/* Decorative stripes */}
                              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400" />
                              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400" />
                              
                              {/* Label content */}
                              <div className="text-center py-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Side A</p>
                                <h3 className="text-lg font-bold text-zinc-800 truncate" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                  {createdMixtape.title}
                                </h3>
                                <p className="text-sm text-zinc-600">For {createdMixtape.recipientName}</p>
                              </div>
                            </div>

                            {/* Tape window area with reels */}
                            <div className="bg-zinc-950 rounded-lg p-4 relative">
                              <div className="flex items-center justify-between gap-4">
                                {/* Left reel */}
                                <div className={`w-16 h-16 rounded-full bg-zinc-800 border-4 border-zinc-600 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
                                  <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                  </div>
                                </div>

                                {/* Center cover art window */}
                                <div className="flex-1 relative">
                                  <div className="aspect-[4/3] rounded-md overflow-hidden border-2 border-zinc-600 bg-zinc-800">
                                    {mixtapeSongs[currentSongIndex]?.imageUrl ? (
                                      <img
                                        src={mixtapeSongs[currentSongIndex].imageUrl!}
                                        alt={mixtapeSongs[currentSongIndex].title || "Song cover"}
                                        className="w-full h-full object-cover"
                                        data-testid="img-cassette-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ListMusic className="w-10 h-10 text-zinc-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right reel */}
                                <div className={`w-16 h-16 rounded-full bg-zinc-800 border-4 border-zinc-600 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
                                  <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom screw holes */}
                            <div className="flex justify-between mt-3 px-2">
                              <div className="w-2 h-2 rounded-full bg-zinc-600 border border-zinc-500" />
                              <div className="w-2 h-2 rounded-full bg-zinc-600 border border-zinc-500" />
                            </div>
                          </div>
                        </div>

                        {/* Now Playing & Controls */}
                        {mixtapeSongs.length > 0 && (
                          <div className="space-y-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Now Playing</p>
                              <h3 className="text-lg font-semibold">{mixtapeSongs[currentSongIndex]?.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Track {currentSongIndex + 1} of {mixtapeSongs.length}
                              </p>
                            </div>

                            {mixtapeSongs[currentSongIndex]?.mediaUrl && (
                              <audio
                                ref={audioRef}
                                src={mixtapeSongs[currentSongIndex].mediaUrl!}
                                className="w-full"
                                controls
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={handleNext}
                                data-testid="audio-mixtape-player-embedded"
                              />
                            )}

                            <div className="flex items-center justify-center gap-4">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrevious}
                                data-testid="button-previous-embedded"
                              >
                                <SkipBack className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                onClick={handlePlayPause}
                                data-testid="button-play-pause-embedded"
                              >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNext}
                                data-testid="button-next-embedded"
                              >
                                <SkipForward className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Tracklist */}
                        {mixtapeSongs.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="px-4 py-2 bg-muted/50 border-b">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <ListMusic className="w-4 h-4 text-primary" />
                                Tracklist
                              </h4>
                            </div>
                            <div className="divide-y">
                              {mixtapeSongs.map((song, index) => (
                                <button
                                  key={song.id}
                                  onClick={() => {
                                    setCurrentSongIndex(index);
                                    setIsPlaying(false);
                                  }}
                                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover-elevate ${
                                    index === currentSongIndex ? 'bg-primary/10' : ''
                                  }`}
                                  data-testid={`button-track-${index}`}
                                >
                                  <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                                    {song.imageUrl ? (
                                      <img
                                        src={song.imageUrl}
                                        alt={song.title || "Song cover"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <Music className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{song.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{song.genre}</p>
                                  </div>
                                  {index === currentSongIndex && isPlaying && (
                                    <div className="flex gap-0.5">
                                      <div className="w-1 h-3 bg-primary animate-pulse rounded" />
                                      <div className="w-1 h-3 bg-primary animate-pulse rounded delay-75" />
                                      <div className="w-1 h-3 bg-primary animate-pulse rounded delay-150" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {mixtapeSongs.length === 0 && (
                          <div className="text-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading tracks...</p>
                          </div>
                        )}
                      </div>
                    ) : createdMixtape.status === 'failed' ? (
                      <div className="text-center py-4">
                        <p className="text-lg font-medium text-red-600">Generation Failed</p>
                        <p className="text-sm text-muted-foreground">
                          Something went wrong. Please try again.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Status: {createdMixtape.status}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button onClick={() => setCreatedMixtape(null)} variant="outline" data-testid="button-create-another-mixtape">
                      Create Another
                    </Button>
                    {createdMixtape.shareableLink && (
                      <Button onClick={() => {
                        const shareLink = `/share/mixtape/${createdMixtape.shareableLink}`;
                        navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                        toast({ title: "Copied!", description: "Shareable link copied to clipboard" });
                      }} data-testid="button-share-mixtape">
                        Share
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListMusic className="w-5 h-5 text-primary" />
                    AI Mixtape Creator
                  </CardTitle>
                  <CardDescription>
                    Create a themed collection of 3 personalized songs perfect for any occasion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-start gap-2">
                      <ListMusic className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">What's a Mixtape?</span> A curated collection of 3 AI-generated songs with complementary styles, perfect for special occasions.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Loader2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Generation Time:</span> Mixtapes take 15-30 minutes to create as we generate 3 full songs with vocals and music.
                      </p>
                    </div>
                  </div>
                  <Form {...mixtapeForm}>
                    <form onSubmit={mixtapeForm.handleSubmit(onMixtapeSubmit)} className="space-y-6">
                      {/* Client Mode Toggle for Mixtapes */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          {isMixtapeClientMode ? (
                            <Briefcase className="w-5 h-5 text-primary" />
                          ) : (
                            <Users className="w-5 h-5 text-primary" />
                          )}
                          <div>
                            <Label htmlFor="mixtape-client-mode" className="text-sm font-medium">
                              {isMixtapeClientMode ? "Creating for a Client" : "Creating for a Loved One"}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {isMixtapeClientMode 
                                ? "Professional mixtape for your business client" 
                                : "Personal mixtape for someone special"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="mixtape-client-mode"
                          checked={isMixtapeClientMode}
                          onCheckedChange={(checked) => {
                            setIsMixtapeClientMode(checked);
                            mixtapeForm.setValue("lovedOneId", "");
                            mixtapeForm.setValue("recipientName", "");
                          }}
                          data-testid="switch-mixtape-client-mode"
                        />
                      </div>

                      {/* Loved One Selector - only show in personal mode */}
                      {!isMixtapeClientMode && (
                        <FormField
                          control={mixtapeForm.control}
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
                                      mixtapeForm.setValue("recipientName", loved.name);
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger data-testid="select-mixtape-loved-one">
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
                      )}

                      <FormField
                        control={mixtapeForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isMixtapeClientMode ? "Client Name" : "Recipient Name"}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={isMixtapeClientMode ? "John Smith" : "Sarah"} 
                                {...field} 
                                data-testid="input-mixtape-recipient" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={mixtapeForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger data-testid="select-mixtape-theme">
                                  <SelectValue placeholder="Select a theme for your mixtape" />
                                </SelectTrigger>
                                <SelectContent>
                                  {isMixtapeClientMode ? (
                                    <>
                                      <SelectItem value="appreciation">Client Appreciation</SelectItem>
                                      <SelectItem value="corporate">Corporate Event</SelectItem>
                                      <SelectItem value="wedding">Wedding</SelectItem>
                                      <SelectItem value="anniversary">Business Anniversary</SelectItem>
                                      <SelectItem value="celebration">Celebration</SelectItem>
                                      <SelectItem value="welcome">Welcome Gift</SelectItem>
                                      <SelectItem value="holiday">Holiday Gift</SelectItem>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem value="wedding">Wedding Celebration</SelectItem>
                                      <SelectItem value="anniversary">Anniversary</SelectItem>
                                      <SelectItem value="birthday-party">Birthday Party</SelectItem>
                                      <SelectItem value="romantic-evening">Romantic Evening</SelectItem>
                                      <SelectItem value="friendship">Friendship</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Each theme sets the mood and tone for your songs
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Custom Cassette Cover Image Upload */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Custom Cassette Cover (optional)</Label>
                        <p className="text-xs text-muted-foreground">
                          Upload your own cover image or let AI generate one for you
                        </p>
                        
                        {customCassetteImageUrl ? (
                          <div className="relative inline-block">
                            <img 
                              src={customCassetteImageUrl} 
                              alt="Custom cassette cover" 
                              className="w-32 h-32 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={clearCustomCassetteCover}
                              data-testid="button-clear-cassette-cover"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isUploadingCassetteCover}
                              onClick={() => document.getElementById('cassette-cover-upload')?.click()}
                              data-testid="button-upload-cassette-cover"
                            >
                              {isUploadingCassetteCover ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            <input
                              id="cassette-cover-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCassetteCoverUpload}
                              data-testid="input-cassette-cover-upload"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <p className="text-sm font-medium">Customize each song</p>
                        
                        <Card className="p-4">
                          <p className="font-medium mb-3">Song 1</p>
                          <div className="space-y-3">
                            <FormField
                              control={mixtapeForm.control}
                              name="genre1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Genre</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-genre1">
                                        <SelectValue placeholder="Select genre" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="r&b">R&B</SelectItem>
                                        <SelectItem value="gospel">Gospel</SelectItem>
                                        <SelectItem value="black-gospel">Black Gospel (Clark Sisters style)</SelectItem>
                                        <SelectItem value="neo-soul">Neo-Soul</SelectItem>
                                        <SelectItem value="soul">Soul</SelectItem>
                                        <SelectItem value="motown">Motown</SelectItem>
                                        <SelectItem value="rap">Rap</SelectItem>
                                        <SelectItem value="hiphop">Hip-Hop</SelectItem>
                                        <SelectItem value="trap">Trap</SelectItem>
                                        <SelectItem value="boom-bap-rap">Boom Bap</SelectItem>
                                        <SelectItem value="conscious-rap">Conscious Rap</SelectItem>
                                        <SelectItem value="gangsta-rap">Gangsta Rap</SelectItem>
                                        <SelectItem value="melodic-rap">Melodic Rap</SelectItem>
                                        <SelectItem value="old-school-rap">Old School Rap</SelectItem>
                                        <SelectItem value="southern-rap">Southern Rap</SelectItem>
                                        <SelectItem value="east-coast-rap">East Coast Rap</SelectItem>
                                        <SelectItem value="west-coast-rap">West Coast Rap</SelectItem>
                                        <SelectItem value="drill">Drill</SelectItem>
                                        <SelectItem value="afrobeat">Afrobeat</SelectItem>
                                        <SelectItem value="jazz">Jazz</SelectItem>
                                        <SelectItem value="blues">Blues</SelectItem>
                                        <SelectItem value="funk">Funk</SelectItem>
                                        <SelectItem value="reggae">Reggae</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="tone1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tone</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-tone1">
                                        <SelectValue placeholder="Select tone" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sweet">Sweet</SelectItem>
                                        <SelectItem value="romantic">Romantic</SelectItem>
                                        <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                        <SelectItem value="fun">Fun</SelectItem>
                                        <SelectItem value="playful">Playful</SelectItem>
                                        <SelectItem value="funny">Funny</SelectItem>
                                        <SelectItem value="nostalgic">Nostalgic</SelectItem>
                                        <SelectItem value="uplifting">Uplifting</SelectItem>
                                        <SelectItem value="grateful">Grateful</SelectItem>
                                        <SelectItem value="celebratory">Celebratory</SelectItem>
                                        <SelectItem value="sentimental">Sentimental</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="voice1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voice (optional)</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-voice1">
                                        <SelectValue placeholder="Any voice" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Any Voice</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="duet">Duet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="duration1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Length</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-duration1">
                                        <SelectValue placeholder="Select length" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="quick">Quick (~1 min)</SelectItem>
                                        <SelectItem value="extended">Extended (~3 min)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="notes1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Special details for this song..." {...field} data-testid="input-mixtape-notes1" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customTitle1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Title (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your custom song title..." {...field} data-testid="input-mixtape-customTitle1" />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a title</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customLyrics1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Lyrics (optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Write your own lyrics here... Leave blank to auto-generate lyrics based on the theme and tone."
                                      className="min-h-[100px]"
                                      {...field} 
                                      data-testid="textarea-mixtape-customLyrics1" 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Both title and lyrics are required for custom songs</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>

                        <Card className="p-4">
                          <p className="font-medium mb-3">Song 2</p>
                          <div className="space-y-3">
                            <FormField
                              control={mixtapeForm.control}
                              name="genre2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Genre</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-genre2">
                                        <SelectValue placeholder="Select genre" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="r&b">R&B</SelectItem>
                                        <SelectItem value="gospel">Gospel</SelectItem>
                                        <SelectItem value="black-gospel">Black Gospel (Clark Sisters style)</SelectItem>
                                        <SelectItem value="neo-soul">Neo-Soul</SelectItem>
                                        <SelectItem value="soul">Soul</SelectItem>
                                        <SelectItem value="motown">Motown</SelectItem>
                                        <SelectItem value="rap">Rap</SelectItem>
                                        <SelectItem value="hiphop">Hip-Hop</SelectItem>
                                        <SelectItem value="trap">Trap</SelectItem>
                                        <SelectItem value="boom-bap-rap">Boom Bap</SelectItem>
                                        <SelectItem value="conscious-rap">Conscious Rap</SelectItem>
                                        <SelectItem value="gangsta-rap">Gangsta Rap</SelectItem>
                                        <SelectItem value="melodic-rap">Melodic Rap</SelectItem>
                                        <SelectItem value="old-school-rap">Old School Rap</SelectItem>
                                        <SelectItem value="southern-rap">Southern Rap</SelectItem>
                                        <SelectItem value="east-coast-rap">East Coast Rap</SelectItem>
                                        <SelectItem value="west-coast-rap">West Coast Rap</SelectItem>
                                        <SelectItem value="drill">Drill</SelectItem>
                                        <SelectItem value="afrobeat">Afrobeat</SelectItem>
                                        <SelectItem value="jazz">Jazz</SelectItem>
                                        <SelectItem value="blues">Blues</SelectItem>
                                        <SelectItem value="funk">Funk</SelectItem>
                                        <SelectItem value="reggae">Reggae</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="tone2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tone</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-tone2">
                                        <SelectValue placeholder="Select tone" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sweet">Sweet</SelectItem>
                                        <SelectItem value="romantic">Romantic</SelectItem>
                                        <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                        <SelectItem value="fun">Fun</SelectItem>
                                        <SelectItem value="playful">Playful</SelectItem>
                                        <SelectItem value="funny">Funny</SelectItem>
                                        <SelectItem value="nostalgic">Nostalgic</SelectItem>
                                        <SelectItem value="uplifting">Uplifting</SelectItem>
                                        <SelectItem value="grateful">Grateful</SelectItem>
                                        <SelectItem value="celebratory">Celebratory</SelectItem>
                                        <SelectItem value="sentimental">Sentimental</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="voice2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voice (optional)</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-voice2">
                                        <SelectValue placeholder="Any voice" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Any Voice</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="duet">Duet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="duration2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Length</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-duration2">
                                        <SelectValue placeholder="Select length" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="quick">Quick (~1 min)</SelectItem>
                                        <SelectItem value="extended">Extended (~3 min)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="notes2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Special details for this song..." {...field} data-testid="input-mixtape-notes2" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customTitle2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Title (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your custom song title..." {...field} data-testid="input-mixtape-customTitle2" />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a title</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customLyrics2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Lyrics (optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Write your own lyrics here... Leave blank to auto-generate lyrics based on the theme and tone."
                                      className="min-h-[100px]"
                                      {...field} 
                                      data-testid="textarea-mixtape-customLyrics2" 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Both title and lyrics are required for custom songs</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>

                        <Card className="p-4">
                          <p className="font-medium mb-3">Song 3</p>
                          <div className="space-y-3">
                            <FormField
                              control={mixtapeForm.control}
                              name="genre3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Genre</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-genre3">
                                        <SelectValue placeholder="Select genre" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="r&b">R&B</SelectItem>
                                        <SelectItem value="gospel">Gospel</SelectItem>
                                        <SelectItem value="black-gospel">Black Gospel (Clark Sisters style)</SelectItem>
                                        <SelectItem value="neo-soul">Neo-Soul</SelectItem>
                                        <SelectItem value="soul">Soul</SelectItem>
                                        <SelectItem value="motown">Motown</SelectItem>
                                        <SelectItem value="rap">Rap</SelectItem>
                                        <SelectItem value="hiphop">Hip-Hop</SelectItem>
                                        <SelectItem value="trap">Trap</SelectItem>
                                        <SelectItem value="boom-bap-rap">Boom Bap</SelectItem>
                                        <SelectItem value="conscious-rap">Conscious Rap</SelectItem>
                                        <SelectItem value="gangsta-rap">Gangsta Rap</SelectItem>
                                        <SelectItem value="melodic-rap">Melodic Rap</SelectItem>
                                        <SelectItem value="old-school-rap">Old School Rap</SelectItem>
                                        <SelectItem value="southern-rap">Southern Rap</SelectItem>
                                        <SelectItem value="east-coast-rap">East Coast Rap</SelectItem>
                                        <SelectItem value="west-coast-rap">West Coast Rap</SelectItem>
                                        <SelectItem value="drill">Drill</SelectItem>
                                        <SelectItem value="afrobeat">Afrobeat</SelectItem>
                                        <SelectItem value="jazz">Jazz</SelectItem>
                                        <SelectItem value="blues">Blues</SelectItem>
                                        <SelectItem value="funk">Funk</SelectItem>
                                        <SelectItem value="reggae">Reggae</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="tone3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tone</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-tone3">
                                        <SelectValue placeholder="Select tone" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sweet">Sweet</SelectItem>
                                        <SelectItem value="romantic">Romantic</SelectItem>
                                        <SelectItem value="heartfelt">Heartfelt</SelectItem>
                                        <SelectItem value="fun">Fun</SelectItem>
                                        <SelectItem value="playful">Playful</SelectItem>
                                        <SelectItem value="funny">Funny</SelectItem>
                                        <SelectItem value="nostalgic">Nostalgic</SelectItem>
                                        <SelectItem value="uplifting">Uplifting</SelectItem>
                                        <SelectItem value="grateful">Grateful</SelectItem>
                                        <SelectItem value="celebratory">Celebratory</SelectItem>
                                        <SelectItem value="sentimental">Sentimental</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="voice3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voice (optional)</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-voice3">
                                        <SelectValue placeholder="Any voice" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Any Voice</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="duet">Duet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="duration3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Length</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger data-testid="select-mixtape-duration3">
                                        <SelectValue placeholder="Select length" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="quick">Quick (~1 min)</SelectItem>
                                        <SelectItem value="extended">Extended (~3 min)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="notes3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Special details for this song..." {...field} data-testid="input-mixtape-notes3" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customTitle3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Title (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your custom song title..." {...field} data-testid="input-mixtape-customTitle3" />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a title</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mixtapeForm.control}
                              name="customLyrics3"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Lyrics (optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Write your own lyrics here... Leave blank to auto-generate lyrics based on the theme and tone."
                                      className="min-h-[100px]"
                                      {...field} 
                                      data-testid="textarea-mixtape-customLyrics3" 
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">Both title and lyrics are required for custom songs</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      </div>

                      {mixtapeMutation.isPending && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <div className="text-center">
                                <p className="font-semibold text-lg">Creating Your Mixtape...</p>
                                <p className="text-sm text-muted-foreground">
                                  {mixtapeGenerationTime < 60 
                                    ? "Starting the music studio..."
                                    : mixtapeGenerationTime < 300
                                    ? "Generating song 1 of 3..."
                                    : mixtapeGenerationTime < 600
                                    ? "Generating song 2 of 3..."
                                    : mixtapeGenerationTime < 900
                                    ? "Generating song 3 of 3..."
                                    : "Finalizing your mixtape..."}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Time elapsed</span>
                                <span className="font-medium">{Math.floor(mixtapeGenerationTime / 60)}:{(mixtapeGenerationTime % 60).toString().padStart(2, '0')}</span>
                              </div>
                              <Progress value={Math.min((mixtapeGenerationTime / 1800) * 100, 95)} className="h-2" />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                              Mixtapes typically take 15-30 minutes to generate
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      <Button type="submit" className="w-full" disabled={mixtapeMutation.isPending} data-testid="button-generate-mixtape">
                        {mixtapeMutation.isPending ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating Mixtape...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2 heartbeat" />
                            Generate Mixtape
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
