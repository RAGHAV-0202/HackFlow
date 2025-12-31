import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/common/StatCard';
import { userApi, hackathonApi } from '@/lib/api';
import { User, Hackathon } from '@/types';
import { Users, Trophy, Shield, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
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
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      description: 'Registered users'
    },
    {
      title: 'Total Hackathons',
      value: hackathons.length,
      icon: Trophy,
      description: 'All hackathons'
    },
    {
      title: 'Active Hackathons',
      value: hackathons.filter(h => h.status === 'ongoing').length,
      icon: Activity,
      description: 'Currently running'
    },
    {
      title: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      icon: Shield,
      description: 'Admin users'
    }
  ];

  const roleDistribution = {
    participant: users.filter(u => u.role === 'participant').length,
    organizer: users.filter(u => u.role === 'organizer').length,
    judge: users.filter(u => u.role === 'judge').length,
    admin: users.filter(u => u.role === 'admin').length
  };

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Distribution</CardTitle>
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">
                Manage Users <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{role}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(count / users.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Hackathons</CardTitle>
            <Link to="/admin/hackathons">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hackathons.slice(0, 5).map((hackathon) => (
                <div
                  key={hackathon._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{hackathon.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(hackathon.startDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={hackathon.status === 'ongoing' ? 'default' : 'secondary'}>
                    {hackathon.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
