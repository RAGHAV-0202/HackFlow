import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/common/StatCard';
import { hackathonApi, userApi } from '@/lib/api';
import { User, Hackathon } from '@/types';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  UserCheck,
  Activity
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SystemSettings = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, hackathonsRes] = await Promise.all([
          userApi.getAllUsers(),
          hackathonApi.getAll()
        ]);
        
        if (usersRes.data?.success) {
          setUsers(usersRes.data.data || []);
        }
        if (hackathonsRes.data?.success) {
          setHackathons(hackathonsRes.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const recentUsers = users.filter(u => 
    u.createdAt && isAfter(new Date(u.createdAt), subDays(new Date(), 7))
  ).length;

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      description: `+${recentUsers} this week`
    },
    {
      title: 'Active Hackathons',
      value: hackathons.filter(h => h.status === 'ongoing').length,
      icon: Activity,
      description: 'Currently running'
    },
    {
      title: 'Total Participants',
      value: hackathons.reduce((acc, h) => acc + (h.participants?.length || 0), 0),
      icon: UserCheck,
      description: 'Across all hackathons'
    },
    {
      title: 'Completion Rate',
      value: `${hackathons.length > 0 
        ? Math.round((hackathons.filter(h => h.status === 'completed').length / hackathons.length) * 100) 
        : 0}%`,
      icon: TrendingUp,
      description: 'Hackathons completed'
    }
  ];

  const roleData = [
    { name: 'Participants', value: users.filter(u => u.role === 'participant').length, color: 'hsl(var(--chart-1))' },
    { name: 'Organizers', value: users.filter(u => u.role === 'organizer').length, color: 'hsl(var(--chart-2))' },
    { name: 'Judges', value: users.filter(u => u.role === 'judge').length, color: 'hsl(var(--chart-3))' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'hsl(var(--chart-4))' }
  ];

  const hackathonStatusData = [
    { name: 'Upcoming', value: hackathons.filter(h => h.status === 'upcoming').length, color: 'hsl(var(--chart-1))' },
    { name: 'Ongoing', value: hackathons.filter(h => h.status === 'ongoing').length, color: 'hsl(var(--chart-2))' },
    { name: 'Completed', value: hackathons.filter(h => h.status === 'completed').length, color: 'hsl(var(--chart-3))' },
    { name: 'Cancelled', value: hackathons.filter(h => h.status === 'cancelled').length, color: 'hsl(var(--chart-4))' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground">Platform statistics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hackathon Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hackathonStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {hackathonStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-medium">Hackathons</span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Total: {hackathons.length}</p>
                <p>Active: {hackathons.filter(h => h.status === 'ongoing').length}</p>
                <p>Upcoming: {hackathons.filter(h => h.status === 'upcoming').length}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Users</span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Total: {users.length}</p>
                <p>Participants: {users.filter(u => u.role === 'participant').length}</p>
                <p>Organizers: {users.filter(u => u.role === 'organizer').length}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="font-medium">Activity</span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>New users (7d): {recentUsers}</p>
                <p>Total teams: {hackathons.reduce((acc, h) => acc + (h.teams?.length || 0), 0)}</p>
                <p>Total rounds: {hackathons.reduce((acc, h) => acc + (h.rounds?.length || 0), 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
