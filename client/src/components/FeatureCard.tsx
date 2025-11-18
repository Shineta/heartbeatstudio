import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  imageUrl?: string;
  onTryIt?: () => void;
}

export default function FeatureCard({ title, description, icon: Icon, imageUrl, onTryIt }: FeatureCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate cursor-pointer group" data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl" style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      {imageUrl && (
        <div className="px-6 pb-4">
          <div className="aspect-square rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      <CardContent className="pt-0">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onTryIt}
          data-testid={`button-try-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Try it now
        </Button>
      </CardContent>
    </Card>
  );
}
