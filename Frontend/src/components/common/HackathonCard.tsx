import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, Clock, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hackathon } from '@/types';

interface HackathonCardProps {
  hackathon: Hackathon;
  index?: number;
}

const HackathonCard = ({ hackathon, index = 0 }: HackathonCardProps) => {
  const getStatusBadge = () => {
    switch (hackathon.status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success/30">Live Now</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-muted">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getTimeInfo = () => {
    const startDate = new Date(hackathon.startDate);
    const endDate = new Date(hackathon.endDate);
    const now = new Date();

    if (hackathon.status === 'upcoming') {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    } else if (hackathon.status === 'ongoing') {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    } else {
      return `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <div className="gradient-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated">
        {/* Banner */}
        <div className="relative h-40 overflow-hidden">
          {hackathon.banner ? (
            <img
              src={hackathon.banner}
              alt={hackathon.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full gradient-primary opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-heading font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {hackathon.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {hackathon.description}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{format(new Date(hackathon.startDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>{hackathon.participants?.length || 0} / {hackathon.maxParticipants || '∞'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4 text-primary" />
              <span>{hackathon.prizes?.length || 0} prizes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{getTimeInfo()}</span>
            </div>
          </div>

          {/* Prizes Preview */}
          {hackathon.prizes && hackathon.prizes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hackathon.prizes.slice(0, 3).map((prize, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {prize.position}: {prize.reward}
                </Badge>
              ))}
            </div>
          )}

          {/* Action */}
          <Button asChild variant="ghost" className="w-full group/btn">
            <Link to={`/hackathons/${hackathon._id}`}>
              View Details
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default HackathonCard;
