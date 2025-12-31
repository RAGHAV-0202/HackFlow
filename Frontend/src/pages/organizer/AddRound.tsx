import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Loader2,
  FileText,
  Video,
  Github,
  Globe,
  Image,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CriteriaBuilder, { CriteriaItem } from '@/components/common/CriteriaBuilder';
import { hackathonApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Hackathon } from '@/types';

const submissionTypes = [
  { value: 'ppt', label: 'Presentation (PPT)', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'github', label: 'GitHub Repository', icon: Github },
  { value: 'live_demo', label: 'Live Demo', icon: Globe },
  { value: 'screenshot', label: 'Screenshots', icon: Image },
  { value: 'document', label: 'Document', icon: File },
  { value: 'multiple', label: 'Multiple Types', icon: File },
];

const roundSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  submissionType: z.enum(['ppt', 'video', 'github', 'live_demo', 'screenshot', 'document', 'multiple']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  maxMarks: z.number().min(1, 'Max marks must be at least 1'),
});

type RoundFormData = z.infer<typeof roundSchema>;

const AddRound = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [criteria, setCriteria] = useState<CriteriaItem[]>([
    { id: '1', name: 'Innovation', description: 'How creative and novel is the solution?', maxScore: 10, weight: 25 },
    { id: '2', name: 'Technical Implementation', description: 'Quality of code and architecture', maxScore: 10, weight: 25 },
    { id: '3', name: 'UI/UX Design', description: 'User interface and experience quality', maxScore: 10, weight: 25 },
    { id: '4', name: 'Presentation', description: 'Clarity and effectiveness of presentation', maxScore: 10, weight: 25 },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RoundFormData>({
    resolver: zodResolver(roundSchema),
    defaultValues: {
      submissionType: 'ppt',
      maxMarks: 100,
    },
  });

  const submissionType = watch('submissionType');

  useEffect(() => {
    if (id) {
      fetchHackathon();
    }
  }, [id]);

  const fetchHackathon = async () => {
    try {
      const response: any = await hackathonApi.getById(id!);
      setHackathon(response.data);
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
    }
  };

  const onSubmit = async (data: RoundFormData) => {
    if (criteria.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one evaluation criteria.',
        variant: 'destructive',
      });
      return;
    }

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      toast({
        title: 'Error',
        description: 'Total weight of criteria must equal 100%.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const roundNumber = (hackathon?.rounds?.length || 0) + 1;
      
      const roundData = {
        ...data,
        roundNumber,
        criteria: criteria.map((c, index) => ({
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
          weight: c.weight,
          order: index + 1,
        })) as any,
      };

      await hackathonApi.addRound(id!, [roundData]);

      toast({
        title: 'Round added!',
        description: `Round ${roundNumber} has been created successfully.`,
      });

      navigate(`/organizer/hackathons/${id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add round.',
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
          Back to Hackathon
        </Button>

        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Add Round</h1>
          {hackathon && (
            <p className="text-muted-foreground">
              Adding round {(hackathon.rounds?.length || 0) + 1} to {hackathon.title}
            </p>
          )}
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Round Details */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Round Details</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Round Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Idea Submission, Prototype Demo"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what participants need to submit..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label>Submission Type *</Label>
              <Select
                value={submissionType}
                onValueChange={(value: any) => setValue('submissionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select submission type" />
                </SelectTrigger>
                <SelectContent>
                  {submissionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
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
                type="datetime-local"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMarks">Maximum Marks *</Label>
              <Input
                id="maxMarks"
                type="number"
                min={1}
                {...register('maxMarks', { valueAsNumber: true })}
              />
              {errors.maxMarks && (
                <p className="text-sm text-destructive">{errors.maxMarks.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div className="rounded-xl border border-border bg-card p-6">
          <CriteriaBuilder criteria={criteria} onChange={setCriteria} />
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
                Adding Round...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Round
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
};

export default AddRound;
