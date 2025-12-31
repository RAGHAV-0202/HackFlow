import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Calendar, Users, Trophy, Plus, X, Loader2, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hackathonApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const hackathonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  maxTeamSize: z.number().min(1).max(10),
  maxParticipants: z.number().optional(),
  banner: z.string().url().optional().or(z.literal('')),
});

type HackathonFormData = z.infer<typeof hackathonSchema>;

const CreateHackathon = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prizes, setPrizes] = useState<{ position: string; reward: string }[]>([
    { position: '1st Place', reward: '' },
    { position: '2nd Place', reward: '' },
    { position: '3rd Place', reward: '' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HackathonFormData>({
    resolver: zodResolver(hackathonSchema),
    defaultValues: {
      maxTeamSize: 4,
    },
  });

  const addPrize = () => {
    setPrizes([...prizes, { position: '', reward: '' }]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, field: 'position' | 'reward', value: string) => {
    const updated = [...prizes];
    updated[index][field] = value;
    setPrizes(updated);
  };

  const onSubmit = async (data: HackathonFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        prizes: prizes.filter(p => p.position && p.reward),
        status: 'upcoming' as const,
      };
      
      await hackathonApi.create(payload);
      
      toast({
        title: 'Hackathon created!',
        description: 'Your hackathon has been successfully created.',
      });
      
      navigate('/organizer/hackathons');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create hackathon.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Create Hackathon</h1>
          <p className="text-muted-foreground">Set up a new hackathon event</p>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Hackathon Title *</Label>
              <Input
                id="title"
                placeholder="e.g., AI Innovation Challenge 2024"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your hackathon, its goals, and what participants can expect..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner">Banner Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="banner"
                  placeholder="https://example.com/banner.jpg"
                  {...register('banner')}
                />
                <Button type="button" variant="outline" size="icon">
                  <Image className="w-4 h-4" />
                </Button>
              </div>
              {errors.banner && (
                <p className="text-sm text-destructive">{errors.banner.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                type="date"
                {...register('registrationDeadline')}
              />
            </div>
          </div>
        </div>

        {/* Team Settings */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTeamSize">Max Team Size *</Label>
              <Input
                id="maxTeamSize"
                type="number"
                min={1}
                max={10}
                {...register('maxTeamSize', { valueAsNumber: true })}
              />
              {errors.maxTeamSize && (
                <p className="text-sm text-destructive">{errors.maxTeamSize.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                placeholder="Unlimited"
                {...register('maxParticipants', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Prizes */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Prizes
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addPrize}>
              <Plus className="w-4 h-4 mr-2" />
              Add Prize
            </Button>
          </div>

          <div className="space-y-4">
            {prizes.map((prize, index) => (
              <div key={index} className="flex items-center gap-3">
                <Badge variant="outline" className="whitespace-nowrap">
                  {index + 1}
                </Badge>
                <Input
                  placeholder="Position (e.g., 1st Place)"
                  value={prize.position}
                  onChange={(e) => updatePrize(index, 'position', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Reward (e.g., $1000)"
                  value={prize.reward}
                  onChange={(e) => updatePrize(index, 'reward', e.target.value)}
                  className="flex-1"
                />
                {prizes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrize(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Hackathon'
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateHackathon;
