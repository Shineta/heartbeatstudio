import LovedOneCard from '../LovedOneCard';
import avatar1 from '@assets/generated_images/Profile_avatar_example_1_4d7ee270.png';
import avatar2 from '@assets/generated_images/Profile_avatar_example_2_7b495653.png';

export default function LovedOneCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
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
    </div>
  );
}
