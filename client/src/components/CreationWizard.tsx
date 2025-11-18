import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Music, Mail, Film, ChevronRight, ChevronLeft } from "lucide-react";

type CreationType = 'song' | 'card' | 'animation' | null;
type Tone = 'sweet' | 'funny' | 'romantic' | 'inspirational' | null;

const steps = [
  'Choose Type',
  'Personalize',
  'Generate',
  'Preview',
  'Send'
];

export default function CreationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [creationType, setCreationType] = useState<CreationType>(null);
  const [tone, setTone] = useState<Tone>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      console.log(`Moving to step ${currentStep + 2}: ${steps[currentStep + 1]}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      console.log(`Moving back to step ${currentStep}: ${steps[currentStep - 1]}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-xs ${idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {steps[currentStep]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setCreationType('song');
                  console.log('Selected: AI Song');
                }}
                className={`p-6 rounded-lg border-2 text-left hover-elevate ${
                  creationType === 'song' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                data-testid="button-select-song"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">AI Song Creator</h3>
                    <p className="text-sm text-muted-foreground">Create a personalized 30-60 second song</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCreationType('card');
                  console.log('Selected: AI Card');
                }}
                className={`p-6 rounded-lg border-2 text-left hover-elevate ${
                  creationType === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                data-testid="button-select-card"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">AI Card Maker</h3>
                    <p className="text-sm text-muted-foreground">Generate a beautiful greeting card</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCreationType('animation');
                  console.log('Selected: Mini Animation');
                }}
                className={`p-6 rounded-lg border-2 text-left hover-elevate ${
                  creationType === 'animation' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                data-testid="button-select-animation"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Mini Animation</h3>
                    <p className="text-sm text-muted-foreground">Create a 10-30 second animated video</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Choose a tone</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['sweet', 'funny', 'romantic', 'inspirational'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTone(t);
                        console.log(`Selected tone: ${t}`);
                      }}
                      className={`p-4 rounded-lg border-2 capitalize hover-elevate ${
                        tone === t ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      data-testid={`button-tone-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center py-8">
              <div className="animate-pulse mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Creating your {creationType}...</h3>
              <p className="text-sm text-muted-foreground">This will just take a moment</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                data-testid="button-wizard-back"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={currentStep === 0 && !creationType}
              data-testid="button-wizard-next"
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
