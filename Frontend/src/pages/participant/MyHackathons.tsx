import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi } from '@/lib/api';
import { Hackathon } from '@/types';
import { format } from 'date-fns';

const MyHackathons = () => {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res: any = await hackathonApi.getAll();
        const userHackathons = res.data?.filter((h: Hackathon) =>
          h.participants?.some((p: any) => p._id === user?._id || p === user?._id)
        ) || [];
        setHackathons(userHackathons);
        setFilteredHackathons(userHackathons);
      } catch (error) {
        console.error('Error fetching hackathons:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHackathons();
    }
  }, [user]);

  useEffect(() => {
    let filtered = hackathons;

    if (searchQuery) {
      filtered = filtered.filter((h) =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((h) => h.status === statusFilter);
    }

    setFilteredHackathons(filtered);
  }, [searchQuery, statusFilter, hackathons]);

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
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Hackathons</h1>
          <p className="text-muted-foreground">Hackathons you've joined</p>
        </div>
        <Button asChild>
          <Link to="/hackathons">Browse More</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search hackathons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hackathons Grid */}
      {filteredHackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={hackathons.length === 0 ? "No hackathons yet" : "No matching hackathons"}
          description={
            hackathons.length === 0
              ? "You haven't joined any hackathons. Browse and register for exciting events!"
              : "Try adjusting your filters to find what you're looking for."
          }
          action={
            hackathons.length === 0
              ? {
                  label: 'Browse Hackathons',
                  onClick: () => window.location.href = '/hackathons',
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHackathons.map((hackathon, index) => (
            <motion.div
              key={hackathon._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            >
              {hackathon.banner ? (
                <div className="h-32 bg-muted">
                  <img
                    src={hackathon.banner}
                    alt={hackathon.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
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
                    {format(new Date(hackathon.startDate), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {hackathon.participants?.length || 0}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/hackathons/${hackathon._id}`}>View Details</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to={`/participant/hackathons/${hackathon._id}/register`}>Team</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHackathons;
