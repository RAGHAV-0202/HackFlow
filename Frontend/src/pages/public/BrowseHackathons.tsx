import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, Loader2, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import HackathonCard from '@/components/common/HackathonCard';
import { hackathonApi } from '@/lib/api';
import { Hackathon } from '@/types';

type StatusFilter = 'all' | 'upcoming' | 'ongoing' | 'completed';

const BrowseHackathons = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    filterHackathons();
  }, [hackathons, searchQuery, statusFilter]);

  const fetchHackathons = async () => {
    try {
      const response: any = await hackathonApi.getAll();
      setHackathons(response.data || []);
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHackathons = () => {
    let filtered = [...hackathons];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((h) => h.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.title.toLowerCase().includes(query) ||
          h.description.toLowerCase().includes(query)
      );
    }

    setFilteredHackathons(filtered);
  };

  const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'bg-secondary text-secondary-foreground' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'ongoing', label: 'Live Now', color: 'bg-success/20 text-success border-success/30' },
    { value: 'completed', label: 'Completed', color: 'bg-muted text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden gradient-hero">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        <div className="absolute inset-0 bg-hero-pattern" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Discover Your Next Challenge</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Browse <span className="text-gradient">Hackathons</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find and join hackathons that match your interests. From AI to Web3, there's something for everyone.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search hackathons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Filter className="w-5 h-5 text-muted-foreground" />
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === filter.value
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredHackathons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                No hackathons found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? `No hackathons match "${searchQuery}"`
                  : 'There are no hackathons available at the moment.'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filteredHackathons.length}</span> hackathon{filteredHackathons.length !== 1 && 's'}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHackathons.map((hackathon, index) => (
                  <HackathonCard key={hackathon._id} hackathon={hackathon} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default BrowseHackathons;
