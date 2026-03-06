import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { Users, Mail, Phone, Calendar, Crown, CheckCircle, XCircle, Download, Search, ArrowLeft, Shield, Video } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  songsRemaining: number;
  subscriptionStatus: string | null;
  marketingConsent: boolean;
  isAdmin: boolean;
  createdAt: string | null;
}

interface AdminStats {
  totalUsers: number;
  usersLast30Days: number;
  usersLast7Days: number;
  activeSubscribers: number;
  marketingOptIns: number;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarketingOnly, setShowMarketingOnly] = useState(false);
  const [showSubscribersOnly, setShowSubscribersOnly] = useState(false);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user?.isAdmin,
  });

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (!authLoading && !user?.isAdmin) {
      setLocation('/dashboard');
    }
  }, [authLoading, user?.isAdmin, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Still show loading while redirect happens
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredUsers = users?.filter(u => {
    const matchesSearch = !searchQuery || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.firstName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phoneNumber?.includes(searchQuery));
    
    const matchesMarketing = !showMarketingOnly || u.marketingConsent;
    const matchesSubscriber = !showSubscribersOnly || u.subscriptionStatus === 'active';
    
    return matchesSearch && matchesMarketing && matchesSubscriber;
  }) || [];

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Phone', 'Marketing Consent', 'Subscription', 'Credits', 'Joined'].join(','),
      ...filteredUsers.map(u => [
        u.email,
        u.firstName || '',
        u.lastName || '',
        u.phoneNumber || '',
        u.marketingConsent ? 'Yes' : 'No',
        u.subscriptionStatus || 'None',
        u.songsRemaining,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartbeat-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard')} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">Manage users and view analytics</p>
            </div>
          </div>
          <Button onClick={() => setLocation('/admin/social-media')} data-testid="button-social-media-studio">
            <Video className="w-4 h-4 mr-2" />
            Social Media Studio
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="stat-total-users">
                {statsLoading ? '...' : stats?.totalUsers || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Last 7 Days</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="stat-7days">
                {statsLoading ? '...' : stats?.usersLast7Days || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Last 30 Days</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="stat-30days">
                {statsLoading ? '...' : stats?.usersLast30Days || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Subscribers</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="stat-subscribers">
                {statsLoading ? '...' : stats?.activeSubscribers || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-pink-500" />
                <span className="text-sm text-muted-foreground">Marketing Opt-ins</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="stat-marketing">
                {statsLoading ? '...' : stats?.marketingOptIns || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="marketing-filter"
                    checked={showMarketingOnly}
                    onCheckedChange={(checked) => setShowMarketingOnly(checked === true)}
                    data-testid="checkbox-marketing-filter"
                  />
                  <Label htmlFor="marketing-filter" className="text-sm cursor-pointer whitespace-nowrap">
                    Marketing opt-ins only
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="subscriber-filter"
                    checked={showSubscribersOnly}
                    onCheckedChange={(checked) => setShowSubscribersOnly(checked === true)}
                    data-testid="checkbox-subscriber-filter"
                  />
                  <Label htmlFor="subscriber-filter" className="text-sm cursor-pointer whitespace-nowrap">
                    Subscribers only
                  </Label>
                </div>
              </div>
              
              <Button variant="outline" onClick={exportUsers} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : usersError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load users. Make sure you have admin access.
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">User</th>
                      <th className="text-left py-3 px-2 font-medium">Contact</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                      <th className="text-left py-3 px-2 font-medium">Marketing</th>
                      <th className="text-left py-3 px-2 font-medium">Credits</th>
                      <th className="text-left py-3 px-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-muted/50" data-testid={`row-user-${u.id}`}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">
                                {u.firstName || u.lastName 
                                  ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                  : 'No name'}
                              </p>
                              {u.isAdmin && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{u.email}</span>
                            </div>
                            {u.phoneNumber && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{u.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {u.subscriptionStatus === 'active' ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <Crown className="w-3 h-3 mr-1" />
                              Subscriber
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {u.marketingConsent ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{u.songsRemaining}</Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
