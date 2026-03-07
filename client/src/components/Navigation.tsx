import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, LogOut, Settings, Coins, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const typedUser = user as User | undefined;

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
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-logo-home">
            <Heart className="w-6 h-6 text-primary fill-primary heartbeat" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Heartbeat Studio
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                by Horton's Tech Innovations
              </span>
            </div>
          </Link>

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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-profile-settings">
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Account Info Section */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account Info</h3>
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={typedUser?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-lg">{typedUser?.firstName?.charAt(0) || typedUser?.email?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold" data-testid="text-profile-name">
                              {typedUser?.firstName && typedUser?.lastName 
                                ? `${typedUser.firstName} ${typedUser.lastName}`
                                : typedUser?.firstName || 'User'}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid="text-profile-email">
                              {typedUser?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Credits Section */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Credits</h3>
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Coins className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-2xl font-bold" data-testid="text-credits-remaining" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                              {typedUser?.songsRemaining ?? 0}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              credits remaining
                            </p>
                          </div>
                          <Link href="/pricing">
                            <Button variant="outline" size="sm" data-testid="button-get-more-credits">
                              Get More
                            </Button>
                          </Link>
                        </div>
                      </div>

                    </div>
                  </DialogContent>
                </Dialog>
                {typedUser?.isAdmin && (
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid="button-admin"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
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

        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {typedUser?.isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-admin-mobile">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                data-testid="button-logout-mobile"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}

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
