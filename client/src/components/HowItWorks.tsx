import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Sparkles, Palette, Send } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Add Loved One",
    description: "Create a profile with their interests, important dates, and special memories",
    icon: UserPlus,
  },
  {
    number: 2,
    title: "Choose Creation",
    description: "Pick from songs, greeting cards, or mini animations",
    icon: Sparkles,
  },
  {
    number: 3,
    title: "Personalize",
    description: "Select tone, style, and add personal touches to make it unique",
    icon: Palette,
  },
  {
    number: 4,
    title: "Send or Schedule",
    description: "Deliver instantly or schedule for the perfect moment via email, text, or link",
    icon: Send,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create thoughtful surprises in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.number} className="hover-elevate" data-testid={`card-step-${step.number}`}>
              <CardHeader>
                <div className="mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary/20" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {step.number}
                  </div>
                </div>
                <CardTitle className="text-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {step.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
