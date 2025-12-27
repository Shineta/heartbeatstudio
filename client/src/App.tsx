import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import VerifyMagicLink from "@/pages/VerifyMagicLink.tsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import RealDashboard from "@/pages/RealDashboard";
import CreatePage from "@/pages/CreatePage";
import SharePage from "@/pages/SharePage";
import MixtapePage from "@/pages/MixtapePage";
import EditMixtapePage from "@/pages/EditMixtapePage";
import PricingPage from "@/pages/PricingPage";
import DateNightExperience from "@/pages/experiences/DateNightExperience";
import BirthdayBlastExperience from "@/pages/experiences/BirthdayBlastExperience";
import GospelGreetingExperience from "@/pages/experiences/GospelGreetingExperience";
import ClassroomCheersExperience from "@/pages/experiences/ClassroomCheersExperience";
import CreateDateNight from "@/pages/experiences/CreateDateNight";
import CreateBirthdayBlast from "@/pages/experiences/CreateBirthdayBlast";
import CreateGospelGreeting from "@/pages/experiences/CreateGospelGreeting";
import CreateClassroomCheers from "@/pages/experiences/CreateClassroomCheers";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== '/auth' && location !== '/' && location !== '/pricing' && !location.startsWith('/auth/verify-magic-link') && !location.startsWith('/auth/reset-password') && !location.startsWith('/share/') && !location.startsWith('/experience/')) {
      setLocation('/auth');
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? RealDashboard : LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/verify-magic-link" component={VerifyMagicLink} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/experience/date-night" component={DateNightExperience} />
      <Route path="/experience/birthday-blast" component={BirthdayBlastExperience} />
      <Route path="/experience/gospel-greeting" component={GospelGreetingExperience} />
      <Route path="/experience/classroom-cheers" component={ClassroomCheersExperience} />
      <Route path="/experience/date-night/create" component={isAuthenticated ? CreateDateNight : AuthPage} />
      <Route path="/experience/birthday-blast/create" component={isAuthenticated ? CreateBirthdayBlast : AuthPage} />
      <Route path="/experience/gospel-greeting/create" component={isAuthenticated ? CreateGospelGreeting : AuthPage} />
      <Route path="/experience/classroom-cheers/create" component={isAuthenticated ? CreateClassroomCheers : AuthPage} />
      <Route path="/share/mixtape/:link" component={MixtapePage} />
      <Route path="/share/:link" component={SharePage} />
      <Route path="/dashboard" component={isAuthenticated ? RealDashboard : AuthPage} />
      <Route path="/create" component={isAuthenticated ? CreatePage : AuthPage} />
      <Route path="/mixtape/:id/edit" component={isAuthenticated ? EditMixtapePage : AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
