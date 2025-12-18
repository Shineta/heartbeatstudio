import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Music, Loader2, GripVertical } from "lucide-react";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Creation, Mixtape } from "@shared/schema";

export default function EditMixtapePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: mixtapeData, isLoading: mixtapeLoading } = useQuery<{ mixtape: Mixtape; songs: Creation[] }>({
    queryKey: ['/api/mixtapes', id],
  });

  const { data: allSongs = [], isLoading: songsLoading } = useQuery<Creation[]>({
    queryKey: ['/api/creations'],
  });

  const availableSongs = allSongs.filter(c => c.type === 'song');

  useEffect(() => {
    if (mixtapeData?.mixtape?.songIds) {
      setSelectedSongIds(mixtapeData.mixtape.songIds);
    }
  }, [mixtapeData]);

  const handleSongToggle = (songId: string) => {
    setSelectedSongIds(prev => {
      if (prev.includes(songId)) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/mixtapes/${id}/songs`, { songIds: selectedSongIds });
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes'] });
      toast({ title: "Success", description: "Mixtape updated successfully!" });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update mixtape",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (mixtapeLoading || songsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mixtapeData?.mixtape) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Mixtape not found</p>
      </div>
    );
  }

  const { mixtape } = mixtapeData;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard')} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Edit Mixtape
            </h1>
            <p className="text-muted-foreground">{mixtape.title}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} data-testid="button-save-mixtape">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Selected Songs ({selectedSongIds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSongIds.length === 0 ? (
              <p className="text-muted-foreground text-sm">No songs selected. Choose songs from below.</p>
            ) : (
              <div className="space-y-2">
                {selectedSongIds.map((songId, index) => {
                  const song = availableSongs.find(s => s.id === songId);
                  if (!song) return null;
                  return (
                    <div 
                      key={songId} 
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      data-testid={`selected-song-${songId}`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt={song.title || ''} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <Music className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.genre}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSongToggle(songId)}
                        data-testid={`button-remove-song-${songId}`}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Songs</CardTitle>
          </CardHeader>
          <CardContent>
            {availableSongs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No songs available. Create some songs first!</p>
            ) : (
              <div className="space-y-2">
                {availableSongs.map(song => {
                  const isSelected = selectedSongIds.includes(song.id);
                  return (
                    <div 
                      key={song.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => handleSongToggle(song.id)}
                      data-testid={`song-option-${song.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSongToggle(song.id)}
                        data-testid={`checkbox-song-${song.id}`}
                      />
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt={song.title || ''} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <Music className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {song.genre} • {song.tone}
                        </p>
                      </div>
                      {song.mediaUrl && (
                        <audio 
                          controls 
                          className="h-8 w-32"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`audio-preview-${song.id}`}
                        >
                          <source src={song.mediaUrl} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
