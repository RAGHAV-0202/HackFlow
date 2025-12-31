import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Users, FileText, Calendar, ArrowRight, Plus, 
  TrendingUp, BarChart3, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi } from '@/lib/api';
import { Hackathon } from '@/types';
import { format } from 'date-fns';

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res: any = await hackathonApi.getAll();
        // Filter hackathons organized by this user
        const myHackathons = res.data?.filter((h: Hackathon) =>
          (h.organizer as any)?._id === user?._id || h.organizer === user?._id
        ) || [];
        setHackathons(myHackathons);
      } catch (error) {
        console.error('Error fetching hackathons:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const totalParticipants = hackathons.reduce((acc, h) => acc + (h.participants?.length || 0), 0);
  const totalTeams = hackathons.reduce((acc, h) => acc + (h.teams?.length || 0), 0);
  const activeHackathons = hackathons.filter(h => h.status === 'ongoing').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Organizer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your hackathons and track engagement.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/organizer/hackathons/create" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Hackathon
          </Link>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hackathons"
          value={hackathons.length}
          icon={Trophy}
          description="Created by you"
        />
        <StatCard
          title="Active Events"
          value={activeHackathons}
          icon={TrendingUp}
          description="Currently running"
        />
        <StatCard
          title="Total Participants"
          value={totalParticipants}
          icon={Users}
          description="Across all events"
        />
        <StatCard
          title="Total Teams"
          value={totalTeams}
          icon={BarChart3}
          description="Registered teams"
        />
      </div>

      {/* Recent Hackathons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Your Hackathons
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/organizer/hackathons" className="flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {hackathons.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No hackathons yet"
            description="Create your first hackathon and start building an amazing community!"
            action={{
              label: 'Create Hackathon',
              onClick: () => window.location.href = '/organizer/hackathons/create',
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hackathons.slice(0, 4).map((hackathon, index) => (
              <motion.div
                key={hackathon._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-lg">{hackathon.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(hackathon.startDate), 'MMM d')} - {format(new Date(hackathon.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <Badge className={getStatusColor(hackathon.status)}>
                    {hackathon.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{hackathon.participants?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Participants</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{hackathon.teams?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Teams</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{hackathon.rounds?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Rounds</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/hackathons/${hackathon._id}`}>View Public</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to={`/organizer/hackathons/${hackathon._id}`}>Manage</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
