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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== '/auth' && location !== '/' && !location.startsWith('/auth/verify-magic-link') && !location.startsWith('/auth/reset-password') && !location.startsWith('/share/')) {
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
