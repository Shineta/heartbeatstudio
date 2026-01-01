import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from "@/components/StatsCard";
import LovedOneCard from "@/components/LovedOneCard";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Calendar, Users, Sparkles, Plus, ListMusic, Play, Loader2, RefreshCw, Pencil, Share2, Check, Music, Download, Heart, Gift, Cake, Clock, X, Send, Mail, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LovedOne, Creation, Mixtape, ScheduledDelivery } from "@shared/schema";

const lovedOneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
  birthday: z.string().optional(),
  interests: z.string().optional(),
  insideJokes: z.string().optional(),
});

const mixtapeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  recipientName: z.string().optional(),
});

const renameFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const scheduleFormSchema = z.object({
  scheduledAt: z.string().min(1, "Date and time required"),
  recipientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  recipientPhone: z.string().optional().or(z.literal("")),
}).refine(data => data.recipientEmail || data.recipientPhone, {
  message: "Please provide an email or phone number",
  path: ["recipientEmail"],
});

export default function RealDashboard() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mixtapeDialogOpen, setMixtapeDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingCreation, setRenamingCreation] = useState<Creation | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [regeneratingCover, setRegeneratingCover] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedLovedOne, setSelectedLovedOne] = useState<LovedOne | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingCreation, setSchedulingCreation] = useState<Creation | null>(null);

  const { data: lovedOnes = [], isLoading } = useQuery<LovedOne[]>({
    queryKey: ['/api/loved-ones'],
  });

  const { data: creations = [], isLoading: creationsLoading } = useQuery<Creation[]>({
    queryKey: ['/api/creations'],
    refetchInterval: (query) => {
      // Auto-refresh every 10 seconds if there are any generating creations
      const data = query.state.data;
      const hasGenerating = data?.some(c => c.status === 'generating');
      return hasGenerating ? 10000 : false;
    },
  });

  const { data: mixtapes = [], isLoading: mixtapesLoading } = useQuery<Mixtape[]>({
    queryKey: ['/api/mixtapes'],
  });

  const { data: scheduledDeliveries = [], isLoading: scheduledLoading } = useQuery<ScheduledDelivery[]>({
    queryKey: ['/api/scheduled-deliveries'],
  });

  const form = useForm<z.infer<typeof lovedOneFormSchema>>({
    resolver: zodResolver(lovedOneFormSchema),
    defaultValues: {
      name: "",
      nickname: "",
      relationship: "",
      birthday: "",
      interests: "",
      insideJokes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof lovedOneFormSchema>) => {
      return await apiRequest("POST", "/api/loved-ones", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loved-ones'] });
      toast({ title: "Success", description: "Loved one added successfully!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add loved one. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof lovedOneFormSchema>) => {
    createMutation.mutate(data);
  };

  const mixtapeForm = useForm<z.infer<typeof mixtapeFormSchema>>({
    resolver: zodResolver(mixtapeFormSchema),
    defaultValues: {
      title: "",
      recipientName: "",
    },
  });

  const createMixtapeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mixtapeFormSchema>) => {
      return await apiRequest("POST", "/api/mixtapes/from-songs", {
        ...data,
        songIds: selectedSongIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes'] });
      toast({ title: "Success", description: "Mixtape created successfully!" });
      setMixtapeDialogOpen(false);
      setSelectedSongIds([]);
      mixtapeForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create mixtape. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onMixtapeSubmit = (data: z.infer<typeof mixtapeFormSchema>) => {
    if (selectedSongIds.length === 0) {
      toast({
        title: "No songs selected",
        description: "Please select at least one song to create a mixtape.",
        variant: "destructive",
      });
      return;
    }
    createMixtapeMutation.mutate(data);
  };

  const renameForm = useForm<z.infer<typeof renameFormSchema>>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: {
      title: "",
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (data: { id: string; title: string }) => {
      return await apiRequest("PATCH", `/api/creations/${data.id}`, { title: data.title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      toast({ title: "Success", description: "Song renamed successfully!" });
      setRenameDialogOpen(false);
      setRenamingCreation(null);
      renameForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to rename. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRenameClick = (creation: Creation) => {
    setRenamingCreation(creation);
    renameForm.setValue("title", creation.title || "");
    setRenameDialogOpen(true);
  };

  const onRenameSubmit = (data: z.infer<typeof renameFormSchema>) => {
    if (!renamingCreation) return;
    renameMutation.mutate({ id: renamingCreation.id, title: data.title });
  };

  const scheduleForm = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      scheduledAt: "",
      recipientEmail: "",
      recipientPhone: "",
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: { creationId: string; scheduledAt: string; recipientEmail?: string; recipientPhone?: string }) => {
      return await apiRequest("POST", `/api/creations/${data.creationId}/schedule`, {
        scheduledAt: data.scheduledAt,
        recipientEmail: data.recipientEmail || undefined,
        recipientPhone: data.recipientPhone || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-deliveries'] });
      toast({ title: "Scheduled!", description: "Your creation will be delivered at the scheduled time." });
      setScheduleDialogOpen(false);
      setSchedulingCreation(null);
      scheduleForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleClick = (creation: Creation) => {
    setSchedulingCreation(creation);
    scheduleForm.reset({
      scheduledAt: "",
      recipientEmail: "",
      recipientPhone: "",
    });
    setScheduleDialogOpen(true);
  };

  const onScheduleSubmit = (data: z.infer<typeof scheduleFormSchema>) => {
    if (!schedulingCreation) return;
    scheduleMutation.mutate({
      creationId: schedulingCreation.id,
      scheduledAt: data.scheduledAt,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
    });
  };

  const cancelScheduleMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      return await apiRequest("PATCH", `/api/scheduled-deliveries/${deliveryId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-deliveries'] });
      toast({ title: "Cancelled", description: "Scheduled delivery has been cancelled." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [deletingCreation, setDeletingCreation] = useState<Creation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/creations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      toast({ title: "Deleted", description: "Song has been permanently deleted." });
      setDeleteDialogOpen(false);
      setDeletingCreation(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (creation: Creation) => {
    setDeletingCreation(creation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCreation) {
      deleteMutation.mutate(deletingCreation.id);
    }
  };

  const toggleSongSelection = (songId: string) => {
    const creation = creations.find(c => c.id === songId);
    if (!creation || creation.type !== 'song') return;
    
    setSelectedSongIds(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const songs = creations.filter(c => c.type === 'song');

  const handleRegenerateCover = async (creationId: string) => {
    setRegeneratingCover(creationId);
    try {
      await apiRequest("POST", `/api/creations/${creationId}/regenerate-cover`);
      queryClient.invalidateQueries({ queryKey: ['/api/creations'] });
      toast({ title: "Success", description: "Cassette cover regenerated!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate cover",
        variant: "destructive",
      });
    } finally {
      setRegeneratingCover(null);
    }
  };

  const handleDownload = async (creation: Creation) => {
    if (!creation.mediaUrl) {
      toast({
        title: "No audio available",
        description: "This song doesn't have audio yet.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(creation.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${creation.title || 'song'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Song downloaded!" });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the song. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Welcome back!
            </h1>
            <p className="text-muted-foreground">Ready to create something special?</p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/create'}
              data-testid="button-create"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  variant="outline"
                  data-testid="button-add-loved-one"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Loved One
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Loved One</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Sarah Johnson" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Sare" {...field} data-testid="input-nickname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="Best Friend" {...field} data-testid="input-relationship" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday (MM-DD)</FormLabel>
                        <FormControl>
                          <Input placeholder="03-15" {...field} data-testid="input-birthday" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Music, art, coffee..." {...field} data-testid="input-interests" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insideJokes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inside Jokes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Remember when..." {...field} data-testid="input-inside-jokes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-loved-one">
                    {createMutation.isPending ? "Adding..." : "Add Loved One"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Upcoming Celebrations"
            value={0}
            icon={Calendar}
            description="In the next 7 days"
          />
          <StatsCard
            title="Loved Ones"
            value={lovedOnes.length}
            icon={Users}
            description="People you celebrate"
          />
          <StatsCard
            title="Creations This Month"
            value={creations.length}
            icon={Sparkles}
            description="Songs and cards created"
          />
        </div>

        <Tabs defaultValue="loved-ones" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="loved-ones" data-testid="tab-loved-ones">Loved Ones</TabsTrigger>
            <TabsTrigger value="creations" data-testid="tab-creations">My Creations</TabsTrigger>
            <TabsTrigger value="mixtapes" data-testid="tab-mixtapes">Mixtapes</TabsTrigger>
            <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="loved-ones">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : lovedOnes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No loved ones yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add someone special to start creating personalized celebrations
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Loved One
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lovedOnes.map((lovedOne) => (
                  <LovedOneCard
                    key={lovedOne.id}
                    id={lovedOne.id}
                    name={lovedOne.name}
                    nickname={lovedOne.nickname || undefined}
                    relationship={lovedOne.relationship}
                    avatarUrl={lovedOne.avatarUrl || undefined}
                    upcomingEvents={0}
                    totalCreations={0}
                    onCreateSong={() => {
                      window.location.href = `/create?type=song&lovedOneId=${lovedOne.id}`;
                    }}
                    onCreateCard={() => {
                      window.location.href = `/create?type=card&lovedOneId=${lovedOne.id}`;
                    }}
                    onCreateAnimation={() => {
                      toast({ title: "Coming Soon", description: "Animation creator will be available soon!" });
                    }}
                    onClick={() => {
                      setSelectedLovedOne(lovedOne);
                      setProfileDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="creations">
            {creationsLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : creations.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No creations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first song or card to see them here
                </p>
                <Button onClick={() => window.location.href = "/create"}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Creating
                </Button>
              </div>
            ) : (
              <>
                {songs.length > 0 && (
                  <div className="flex items-center justify-between mb-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {selectedSongIds.length > 0 
                          ? `${selectedSongIds.length} song${selectedSongIds.length > 1 ? 's' : ''} selected`
                          : 'Select songs to create a mixtape'}
                      </span>
                    </div>
                    <Button
                      onClick={() => setMixtapeDialogOpen(true)}
                      disabled={selectedSongIds.length === 0}
                      data-testid="button-create-mixtape-from-songs"
                    >
                      <ListMusic className="w-4 h-4 mr-2" />
                      Create Mixtape
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creations.map((creation) => (
                    <div key={creation.id} className={`border rounded-md overflow-hidden hover-elevate relative ${selectedSongIds.includes(creation.id) ? 'ring-2 ring-primary' : ''}`} data-testid={`card-creation-${creation.id}`}>
                      {creation.type === 'song' && creation.status !== 'generating' && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedSongIds.includes(creation.id)}
                            onCheckedChange={() => toggleSongSelection(creation.id)}
                            className="bg-background"
                            data-testid={`checkbox-song-${creation.id}`}
                          />
                        </div>
                      )}
                      {creation.status === 'generating' && (
                        <div className="absolute top-2 right-2 z-10 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Creating...
                        </div>
                      )}
                      {creation.status === 'failed' && (
                        <div className="absolute top-2 right-2 z-10 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs font-medium px-2 py-1 rounded-full">
                          Failed
                        </div>
                      )}
                      {creation.imageUrl ? (
                        <img
                          src={creation.imageUrl}
                          alt={creation.title || "Creation"}
                          className="w-full h-48 object-cover"
                        />
                      ) : creation.status === 'generating' ? (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Generating song...</p>
                          </div>
                        </div>
                      ) : null}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{creation.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {creation.type === 'song' ? 'Song' : 'Card'} • {creation.tone}
                        </p>
                        <p className="text-sm line-clamp-3 mb-4">{creation.content}</p>
                        
                        {creation.type === 'song' && creation.mediaUrl && (
                          <div className="mb-4">
                            <audio 
                              controls 
                              preload="auto"
                              className="w-full mb-2"
                              data-testid={`audio-player-${creation.id}`}
                            >
                              <source src={`/api/audio/${creation.id}`} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        
                        {creation.status === 'generating' ? (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            Song is being created... This may take 2-4 minutes.
                          </div>
                        ) : creation.status === 'failed' ? (
                          <div className="space-y-3">
                            <div className="text-sm text-red-600 dark:text-red-400 text-center py-2">
                              Generation failed. Please try creating a new song.
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(creation);
                              }}
                              className="w-full text-destructive hover:text-destructive"
                              data-testid={`button-delete-failed-${creation.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="ml-1">Delete</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(creation);
                              }}
                              data-testid={`button-rename-${creation.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="ml-1">Rename</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const shareLink = creation.shareableLink?.startsWith('/share/') 
                                  ? creation.shareableLink 
                                  : `/share/${creation.shareableLink}`;
                                navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
                                toast({ title: "Copied!", description: "Link copied to clipboard" });
                              }}
                              data-testid="button-share-creation"
                            >
                              Share
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleClick(creation);
                              }}
                              data-testid={`button-schedule-${creation.id}`}
                            >
                              <Clock className="w-4 h-4" />
                              <span className="ml-1">Schedule</span>
                            </Button>
                            {creation.type === 'song' && creation.mediaUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(creation);
                                }}
                                data-testid={`button-download-${creation.id}`}
                              >
                                <Download className="w-4 h-4" />
                                <span className="ml-1">Download</span>
                              </Button>
                            )}
                            {creation.type === 'song' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegenerateCover(creation.id);
                                }}
                                disabled={regeneratingCover === creation.id}
                                data-testid={`button-regenerate-cover-${creation.id}`}
                              >
                                {regeneratingCover === creation.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                <span className="ml-1">New Cover</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(creation);
                              }}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${creation.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="ml-1">Delete</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="mixtapes">
            {mixtapesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading mixtapes...</p>
              </div>
            ) : mixtapes.length === 0 ? (
              <div className="text-center py-12">
                <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No mixtapes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a custom mixtape with 3 personalized songs
                </p>
                <Button onClick={() => window.location.href = '/create'} data-testid="button-create-mixtape">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Mixtape
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mixtapes.map((mixtape) => (
                  <Card key={mixtape.id} className="hover-elevate cursor-pointer" onClick={() => {
                    if (mixtape.shareableLink) {
                      window.location.href = `/share/mixtape/${mixtape.shareableLink}`;
                    }
                  }} data-testid={`card-mixtape-${mixtape.id}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ListMusic className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{mixtape.title}</CardTitle>
                          <CardDescription className="truncate">
                            For {mixtape.recipientName}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {mixtape.theme?.replace('-', ' ') || 'Custom'} Theme
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          mixtape.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          mixtape.status === 'generating' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {mixtape.status === 'complete' ? 'Ready' : mixtape.status === 'generating' ? 'Creating...' : 'Failed'}
                        </span>
                      </div>
                      {mixtape.status === 'complete' && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-play-mixtape-${mixtape.id}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/mixtape/${mixtape.id}/edit`;
                            }}
                            data-testid={`button-edit-mixtape-${mixtape.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const shareUrl = `${window.location.origin}/share/mixtape/${mixtape.shareableLink}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast({ title: "Copied!", description: "Mixtape link copied to clipboard" });
                            }}
                            data-testid={`button-share-mixtape-${mixtape.id}`}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            {scheduledLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading scheduled deliveries...</p>
              </div>
            ) : scheduledDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled deliveries</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule a song or card to be sent at a specific time
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledDeliveries.map((delivery) => {
                  const creation = creations.find(c => c.id === delivery.creationId);
                  return (
                    <Card key={delivery.id} data-testid={`card-scheduled-${delivery.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {creation?.type === 'song' ? (
                                <Music className="w-6 h-6 text-primary" />
                              ) : (
                                <Send className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{creation?.title || 'Untitled'}</CardTitle>
                              <CardDescription className="truncate">
                                {delivery.recipientEmail && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {delivery.recipientEmail}
                                  </span>
                                )}
                                {delivery.recipientPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {delivery.recipientPhone}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={
                            delivery.status === 'pending' ? 'default' :
                            delivery.status === 'sent' ? 'secondary' :
                            'destructive'
                          }>
                            {delivery.status === 'pending' ? 'Scheduled' :
                             delivery.status === 'sent' ? 'Sent' :
                             'Cancelled'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(delivery.scheduledAt).toLocaleString()}</span>
                        </div>
                        {delivery.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelScheduleMutation.mutate(delivery.id)}
                            disabled={cancelScheduleMutation.isPending}
                            data-testid={`button-cancel-${delivery.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent data-testid="dialog-schedule-delivery">
          <DialogHeader>
            <DialogTitle>Schedule Delivery</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Send "{schedulingCreation?.title}" at a specific date and time.
          </p>
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        data-testid="input-schedule-datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="friend@example.com" 
                        {...field} 
                        data-testid="input-schedule-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Phone (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        data-testid="input-schedule-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Provide at least an email or phone number to send the delivery.
              </p>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setScheduleDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={scheduleMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-schedule"
                >
                  {scheduleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  Schedule
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-creation">
          <DialogHeader>
            <DialogTitle>Delete Creation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete "{deletingCreation?.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mixtapeDialogOpen} onOpenChange={setMixtapeDialogOpen}>
        <DialogContent data-testid="dialog-create-mixtape">
          <DialogHeader>
            <DialogTitle>Create Mixtape from Songs</DialogTitle>
          </DialogHeader>
          <Form {...mixtapeForm}>
            <form onSubmit={mixtapeForm.handleSubmit(onMixtapeSubmit)} className="space-y-4">
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Songs ({selectedSongIds.length}):</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedSongIds.map(id => {
                    const song = creations.find(c => c.id === id);
                    return song ? <li key={id}>• {song.title}</li> : null;
                  })}
                </ul>
              </div>
              <FormField
                control={mixtapeForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mixtape Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Holiday Mixtape" {...field} data-testid="input-mixtape-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mixtapeForm.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Who is this mixtape for?" {...field} data-testid="input-mixtape-recipient" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createMixtapeMutation.isPending} data-testid="button-submit-mixtape">
                {createMixtapeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Mixtape...
                  </>
                ) : (
                  <>
                    <ListMusic className="w-4 h-4 mr-2" />
                    Create Mixtape
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent data-testid="dialog-rename-creation">
          <DialogHeader>
            <DialogTitle>Rename {renamingCreation?.type === 'song' ? 'Song' : 'Creation'}</DialogTitle>
          </DialogHeader>
          <Form {...renameForm}>
            <form onSubmit={renameForm.handleSubmit(onRenameSubmit)} className="space-y-4">
              <FormField
                control={renameForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new title" {...field} data-testid="input-rename-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={renameMutation.isPending} data-testid="button-submit-rename">
                {renameMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog for Loved One Details */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-loved-one-profile">
          <DialogHeader>
            <DialogTitle className="sr-only">Profile Details</DialogTitle>
          </DialogHeader>
          {selectedLovedOne && (
            <div className="space-y-6">
              {/* Header with Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedLovedOne.avatarUrl || undefined} alt={selectedLovedOne.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {selectedLovedOne.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {selectedLovedOne.name}
                  </h2>
                  {selectedLovedOne.nickname && (
                    <p className="text-muted-foreground">"{selectedLovedOne.nickname}"</p>
                  )}
                  <Badge variant="secondary" className="mt-1">
                    <Heart className="w-3 h-3 mr-1" />
                    {selectedLovedOne.relationship}
                  </Badge>
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                {selectedLovedOne.birthday && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Cake className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Birthday</p>
                      <p className="text-muted-foreground">
                        {(() => {
                          const [month, day] = selectedLovedOne.birthday!.split('-');
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                            'July', 'August', 'September', 'October', 'November', 'December'];
                          return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {selectedLovedOne.interests && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Gift className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Interests</p>
                      <p className="text-muted-foreground">{selectedLovedOne.interests}</p>
                    </div>
                  </div>
                )}

                {selectedLovedOne.insideJokes && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Inside Jokes & Special Memories</p>
                      <p className="text-muted-foreground">{selectedLovedOne.insideJokes}</p>
                    </div>
                  </div>
                )}

                {!selectedLovedOne.birthday && !selectedLovedOne.interests && !selectedLovedOne.insideJokes && (
                  <p className="text-center text-muted-foreground py-4">
                    No additional details added yet
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    window.location.href = `/create?type=song&lovedOneId=${selectedLovedOne.id}`;
                  }}
                  data-testid="button-profile-create-song"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-xs">Create Song</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    window.location.href = `/create?type=card&lovedOneId=${selectedLovedOne.id}`;
                  }}
                  data-testid="button-profile-create-card"
                >
                  <Gift className="w-5 h-5" />
                  <span className="text-xs">Create Card</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => {
                    toast({ title: "Coming Soon", description: "Animation creator will be available soon!" });
                  }}
                  data-testid="button-profile-create-animation"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs">Animation</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
