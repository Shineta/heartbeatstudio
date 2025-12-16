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
import { Calendar, Users, Sparkles, Plus, ListMusic, Play, Loader2, Music } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LovedOne, Creation, Mixtape } from "@shared/schema";

const lovedOneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
  birthday: z.string().optional(),
  interests: z.string().optional(),
  insideJokes: z.string().optional(),
});

export default function RealDashboard() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: lovedOnes = [], isLoading } = useQuery<LovedOne[]>({
    queryKey: ['/api/loved-ones'],
  });

  const { data: creations = [], isLoading: creationsLoading } = useQuery<Creation[]>({
    queryKey: ['/api/creations'],
  });

  const { data: mixtapes = [], isLoading: mixtapesLoading } = useQuery<Mixtape[]>({
    queryKey: ['/api/mixtapes'],
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
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
                      toast({ title: "Profile View", description: "Detailed profile view coming soon!" });
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creations.map((creation) => (
                  <div key={creation.id} className="border rounded-md overflow-hidden hover-elevate" data-testid={`card-creation-${creation.id}`}>
                    {/* Cassette/Card Cover Art */}
                    {creation.imageUrl ? (
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={creation.imageUrl}
                          alt={creation.title || "Creation"}
                          className="w-full h-full object-cover"
                          data-testid={`img-creation-cover-${creation.id}`}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {creation.type === 'song' ? (
                          <Music className="w-16 h-16 text-muted-foreground" />
                        ) : (
                          <Sparkles className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                    )}
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
                            className="w-full mb-2"
                            data-testid={`audio-player-${creation.id}`}
                          >
                            <source src={creation.mediaUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <Card key={mixtape.id} className="hover-elevate cursor-pointer overflow-hidden" onClick={() => {
                    if (mixtape.shareableLink) {
                      window.location.href = `/share/mixtape/${mixtape.shareableLink}`;
                    }
                  }} data-testid={`card-mixtape-${mixtape.id}`}>
                    {/* Cassette Cover Art */}
                    {mixtape.cassetteCaseImageUrl ? (
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={mixtape.cassetteCaseImageUrl}
                          alt={`${mixtape.title} cassette cover`}
                          className="w-full h-full object-cover"
                          data-testid={`img-mixtape-cover-${mixtape.id}`}
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${
                            mixtape.status === 'complete' ? 'bg-green-500/80 text-white' :
                            mixtape.status === 'generating' ? 'bg-yellow-500/80 text-white' :
                            'bg-red-500/80 text-white'
                          }`}>
                            {mixtape.status === 'complete' ? 'Ready' : mixtape.status === 'generating' ? 'Creating...' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square relative bg-muted flex items-center justify-center">
                        <ListMusic className="w-16 h-16 text-muted-foreground" />
                        <div className="absolute top-2 right-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            mixtape.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            mixtape.status === 'generating' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {mixtape.status === 'complete' ? 'Ready' : mixtape.status === 'generating' ? 'Creating...' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate mb-1">{mixtape.title}</h3>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        For {mixtape.recipientName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {mixtape.theme?.replace('-', ' ') || 'Custom'} Theme
                      </p>
                      {mixtape.status === 'complete' && (
                        <Button variant="outline" size="sm" className="w-full mt-3" data-testid={`button-play-mixtape-${mixtape.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Play Mixtape
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
