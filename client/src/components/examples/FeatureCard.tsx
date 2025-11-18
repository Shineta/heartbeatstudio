import FeatureCard from '../FeatureCard';
import { Music, Mail, Film } from 'lucide-react';
import songPreview from '@assets/generated_images/Song_creator_preview_dfc9ad30.png';
import cardPreview from '@assets/generated_images/Card_maker_preview_e83ca765.png';
import animationPreview from '@assets/generated_images/Animation_maker_preview_2accf1ac.png';

export default function FeatureCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
      <FeatureCard
        title="AI Song Creator"
        description="Create personalized 30-60 second songs with custom lyrics, music, and cover art in any style or genre."
        icon={Music}
        imageUrl={songPreview}
        onTryIt={() => console.log('Try AI Song Creator')}
      />
      <FeatureCard
        title="AI Card Maker"
        description="Generate beautiful greeting cards with AI-crafted messages and stunning illustrations for any occasion."
        icon={Mail}
        imageUrl={cardPreview}
        onTryIt={() => console.log('Try AI Card Maker')}
      />
      <FeatureCard
        title="Mini Animations"
        description="Make 10-30 second animated videos with photos, text, and music that bring your celebrations to life."
        icon={Film}
        imageUrl={animationPreview}
        onTryIt={() => console.log('Try Mini Animations')}
      />
    </div>
  );
}
