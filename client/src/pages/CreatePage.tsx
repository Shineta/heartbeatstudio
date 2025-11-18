import Navigation from "@/components/Navigation";
import CreationWizard from "@/components/CreationWizard";
import ThemeToggle from "@/components/ThemeToggle";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Navigation />
      
      <div className="py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Create Something Magical
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow the steps to create a personalized celebration
          </p>
        </div>
        
        <CreationWizard />
      </div>
    </div>
  );
}
