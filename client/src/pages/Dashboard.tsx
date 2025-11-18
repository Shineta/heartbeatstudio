import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from "@/components/StatsCard";
import LovedOneCard from "@/components/LovedOneCard";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Calendar, Users, Sparkles, Plus } from "lucide-react";
import avatar1 from '@assets/generated_images/Profile_avatar_example_1_4d7ee270.png';
import avatar2 from '@assets/generated_images/Profile_avatar_example_2_7b495653.png';

export default function Dashboard() {
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
          <Button 
            size="lg"
            onClick={() => console.log('Create new clicked')}
            data-testid="button-create-new"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Tabs defaultValue="loved-ones" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="loved-ones" data-testid="tab-loved-ones">Loved Ones</TabsTrigger>
            <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="past-creations" data-testid="tab-past-creations">Past Creations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="loved-ones">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <LovedOneCard
                id="1"
                name="Sarah Johnson"
                nickname="Sare"
                relationship="Best Friend"
                avatarUrl={avatar1}
                upcomingEvents={2}
                totalCreations={12}
                onCreateSong={() => console.log('Create song for Sarah')}
                onCreateCard={() => console.log('Create card for Sarah')}
                onCreateAnimation={() => console.log('Create animation for Sarah')}
                onClick={() => console.log('View Sarah profile')}
              />
              <LovedOneCard
                id="2"
                name="Mom"
                relationship="Mother"
                avatarUrl={avatar2}
                upcomingEvents={1}
                totalCreations={25}
                onCreateSong={() => console.log('Create song for Mom')}
                onCreateCard={() => console.log('Create card for Mom')}
                onCreateAnimation={() => console.log('Create animation for Mom')}
                onClick={() => console.log('View Mom profile')}
              />
              <LovedOneCard
                id="3"
                name="Alex Chen"
                relationship="Partner"
                upcomingEvents={3}
                totalCreations={18}
                onCreateSong={() => console.log('Create song for Alex')}
                onCreateCard={() => console.log('Create card for Alex')}
                onCreateAnimation={() => console.log('Create animation for Alex')}
                onClick={() => console.log('View Alex profile')}
              />
              <LovedOneCard
                id="4"
                name="Jordan Williams"
                relationship="Sibling"
                upcomingEvents={0}
                totalCreations={8}
                onCreateSong={() => console.log('Create song for Jordan')}
                onCreateCard={() => console.log('Create card for Jordan')}
                onCreateAnimation={() => console.log('Create animation for Jordan')}
                onClick={() => console.log('View Jordan profile')}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled celebrations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule a creation to be delivered at the perfect moment
              </p>
              <Button onClick={() => console.log('Create scheduled celebration')}>
                Create & Schedule
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="past-creations">
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your creation history</h3>
              <p className="text-sm text-muted-foreground">
                All your songs, cards, and animations will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
