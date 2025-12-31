import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Plus, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { hackathonApi } from '@/lib/api';
import { Hackathon } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const OrganizerHackathons = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHackathons();
  }, [user]);

  const fetchHackathons = async () => {
    if (!user) return;
    try {
      const res: any = await hackathonApi.getAll();
      const myHackathons = res.data?.filter((h: Hackathon) =>
        (h.organizer as any)?._id === user._id || h.organizer === user._id
      ) || [];
      setHackathons(myHackathons);
      setFilteredHackathons(myHackathons);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setFilteredHackathons(
        hackathons.filter((h) =>
          h.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredHackathons(hackathons);
    }
  }, [searchQuery, hackathons]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hackathon?')) return;
    
    try {
      await hackathonApi.delete(id);
      toast({
        title: 'Hackathon deleted',
        description: 'The hackathon has been successfully deleted.',
      });
      fetchHackathons();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete hackathon.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
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
          <p className="text-muted-foreground">Manage hackathons you've created</p>
        </div>
        <Button asChild>
          <Link to="/organizer/hackathons/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search hackathons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Hackathons List */}
      {filteredHackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={hackathons.length === 0 ? "No hackathons yet" : "No matching hackathons"}
          description={
            hackathons.length === 0
              ? "Create your first hackathon and start building a community!"
              : "Try adjusting your search query."
          }
          action={
            hackathons.length === 0
              ? {
                  label: 'Create Hackathon',
                  onClick: () => window.location.href = '/organizer/hackathons/create',
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredHackathons.map((hackathon, index) => (
            <motion.div
              key={hackathon._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground text-lg">{hackathon.title}</h3>
                    <Badge className={getStatusColor(hackathon.status)}>
                      {hackathon.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(hackathon.startDate), 'MMM d')} - {format(new Date(hackathon.endDate), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {hackathon.participants?.length || 0} participants
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {hackathon.teams?.length || 0} teams
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/hackathons/${hackathon._id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={`/organizer/hackathons/${hackathon._id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/organizer/hackathons/${hackathon._id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(hackathon._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerHackathons;
