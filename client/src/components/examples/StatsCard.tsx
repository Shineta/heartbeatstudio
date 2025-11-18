import StatsCard from '../StatsCard';
import { Calendar, Users, Sparkles } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
      <StatsCard
        title="Upcoming Celebrations"
        value={7}
        icon={Calendar}
        description="In the next 7 days"
      />
      <StatsCard
        title="Loved Ones"
        value={12}
        icon={Users}
        description="People you celebrate"
      />
      <StatsCard
        title="Creations This Month"
        value={24}
        icon={Sparkles}
        description="+8 from last month"
      />
    </div>
  );
}
