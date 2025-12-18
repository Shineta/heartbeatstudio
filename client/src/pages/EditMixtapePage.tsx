import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Music, Loader2, GripVertical, Plus, RefreshCw } from "lucide-react";
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
  const [regeneratingCover, setRegeneratingCover] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleRegenerateCover = async () => {
    if (!id) return;
    setRegeneratingCover(true);
    try {
      // If there's an existing cover that looks like an unprocessed image (not composited), 
      // try to composite it with the cassette. Otherwise, generate a new AI cover.
      const currentUrl = mixtapeData?.mixtape?.cassetteCaseImageUrl;
      await apiRequest("POST", `/api/mixtapes/${id}/generate-cassette-cover`, 
        currentUrl ? { customImageUrl: currentUrl } : {}
      );
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/mixtapes'] });
      toast({ title: "Success", description: "Cassette cover regenerated!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate cover",
        variant: "destructive",
      });
    } finally {
      setRegeneratingCover(false);
    }
  };

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...selectedSongIds];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setSelectedSongIds(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
          <Button 
            variant="outline"
            onClick={handleRegenerateCover} 
            disabled={regeneratingCover}
            data-testid="button-regenerate-cover"
          >
            {regeneratingCover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Regenerate Cover
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="button-save-mixtape">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Selected Songs ({selectedSongIds.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Drag songs to reorder them</p>
          </CardHeader>
          <CardContent>
            {selectedSongIds.length === 0 ? (
              <p className="text-muted-foreground text-sm">No songs selected. Choose songs from below.</p>
            ) : (
              <div className="space-y-2">
                {selectedSongIds.map((songId, index) => {
                  const song = availableSongs.find(s => s.id === songId);
                  if (!song) return null;
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;
                  return (
                    <div 
                      key={songId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      data-testid={`selected-song-${songId}`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
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
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Available Songs</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Check songs below to add them to your mixtape
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/create?type=song')}
              data-testid="button-create-more-songs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create More Songs
            </Button>
          </CardHeader>
          <CardContent>
            {availableSongs.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No songs available yet.</p>
                <Button onClick={() => setLocation('/create?type=song')} data-testid="button-create-first-song">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Song
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSongs.map(song => {
                  const isSelected = selectedSongIds.includes(song.id);
                  return (
                    <div 
                      key={song.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                      }`}
                      data-testid={`song-option-${song.id}`}
                    >
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
                      <Button
                        size="sm"
                        variant={isSelected ? "secondary" : "default"}
                        onClick={() => handleSongToggle(song.id)}
                        data-testid={`button-toggle-song-${song.id}`}
                      >
                        {isSelected ? "Added" : "Add"}
                      </Button>
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
