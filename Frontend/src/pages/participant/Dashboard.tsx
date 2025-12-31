import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, FileText, Calendar, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi, teamApi } from '@/lib/api';
import { Hackathon, Team } from '@/types';
import { format } from 'date-fns';

const ParticipantDashboard = () => {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonRes: any = await hackathonApi.getAll();
        // Filter hackathons where user is a participant
        const userHackathons = hackathonRes.data?.filter((h: Hackathon) =>
          h.participants?.some((p: any) => p._id === user?._id || p === user?._id)
        ) || [];
        setHackathons(userHackathons);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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
        className="space-y-2"
      >
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your hackathons.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hackathons Joined"
          value={hackathons.length}
          icon={Trophy}
          description="Total hackathons"
        />
        <StatCard
          title="Active Teams"
          value={user?.teams?.length || 0}
          icon={Users}
          description="Teams you're part of"
        />
        <StatCard
          title="Submissions"
          value={0}
          icon={FileText}
          description="Total submissions"
        />
        <StatCard
          title="Upcoming"
          value={hackathons.filter(h => h.status === 'upcoming').length}
          icon={Calendar}
          description="Starting soon"
        />
      </div>

      {/* Active Hackathons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Your Hackathons
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/hackathons" className="flex items-center gap-2">
              Browse More <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {hackathons.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No hackathons yet"
            description="You haven't joined any hackathons. Browse and register for exciting events!"
            action={{
              label: 'Browse Hackathons',
              onClick: () => window.location.href = '/hackathons',
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hackathons.slice(0, 6).map((hackathon, index) => (
              <motion.div
                key={hackathon._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                {hackathon.banner && (
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                    <img
                      src={hackathon.banner}
                      alt={hackathon.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!hackathon.banner && (
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {hackathon.title}
                    </h3>
                    <Badge className={getStatusColor(hackathon.status)}>
                      {hackathon.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {hackathon.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(hackathon.startDate), 'MMM d')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {hackathon.participants?.length || 0}
                    </span>
                  </div>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/hackathons/${hackathon._id}`}>
                      View Details
                    </Link>
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

export default ParticipantDashboard;
