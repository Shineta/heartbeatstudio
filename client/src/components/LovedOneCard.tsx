import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Mail, Film, Calendar, Pencil, Trash2 } from "lucide-react";

interface LovedOneCardProps {
  id: string;
  name: string;
  nickname?: string;
  relationship: string;
  avatarUrl?: string;
  upcomingEvents: number;
  totalCreations: number;
  onCreateSong?: () => void;
  onCreateCard?: () => void;
  onCreateAnimation?: () => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function LovedOneCard({ 
  id,
  name, 
  nickname,
  relationship, 
  avatarUrl,
  upcomingEvents,
  totalCreations,
  onCreateSong,
  onCreateCard,
  onCreateAnimation,
  onClick,
  onEdit,
  onDelete,
}: LovedOneCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`card-loved-one-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg leading-none mb-1 truncate" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {name}
                {nickname && <span className="text-muted-foreground ml-1">"{nickname}"</span>}
              </h3>
              <Badge variant="secondary" className="text-xs">{relationship}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                data-testid={`button-edit-loved-one-${id}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                data-testid={`button-delete-loved-one-${id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{upcomingEvents} upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{totalCreations} creations</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-auto py-2 px-2 flex flex-col gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSong?.();
            }}
            data-testid={`button-create-song-${id}`}
          >
            <Music className="w-4 h-4" />
            <span className="text-xs">Song</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-auto py-2 px-2 flex flex-col gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCard?.();
            }}
            data-testid={`button-create-card-${id}`}
          >
            <Mail className="w-4 h-4" />
            <span className="text-xs">Card</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-auto py-2 px-2 flex flex-col gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAnimation?.();
            }}
            data-testid={`button-create-animation-${id}`}
          >
            <Film className="w-4 h-4" />
            <span className="text-xs">Video</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
