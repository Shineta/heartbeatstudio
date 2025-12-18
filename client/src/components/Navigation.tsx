import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const typedUser = user as User | undefined;

  const handleOpenSettings = () => {
    setBrandName(typedUser?.brandName || "");
    setSettingsOpen(true);
  };

  const handleSaveBrandName = async () => {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/user", { brandName });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Brand name updated!" });
      setSettingsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand name.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear the user query cache to remove authentication state
        queryClient.setQueryData(['/api/auth/user'], null);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        window.location.href = '/';
      } else {
        toast({
          title: 'Logout failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary heartbeat" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Heartbeat Studio
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                by Horton's Tech Innovations
              </span>
            </div>
          </div>

          {!isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-8">
                <a 
                  href="#features" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  How It Works
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Pricing
                </a>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/auth'}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                {typedUser && (
                  <>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={typedUser.profileImageUrl || undefined} />
                      <AvatarFallback>{typedUser.firstName?.charAt(0) || typedUser.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{typedUser.firstName || typedUser.email}</span>
                  </>
                )}
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleOpenSettings}
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="brandName">Brand Name</Label>
                        <Input
                          id="brandName"
                          placeholder="Your business or brand name"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          data-testid="input-brand-name"
                        />
                        <p className="text-xs text-muted-foreground">
                          This will appear on shared mixtapes as "by [Your Brand Name]"
                        </p>
                      </div>
                      <Button 
                        onClick={handleSaveBrandName} 
                        disabled={saving}
                        className="w-full"
                        data-testid="button-save-brand"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && !isAuthenticated && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/auth'}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
