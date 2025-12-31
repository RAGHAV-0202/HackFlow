import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  X,
  FileText,
  Video,
  Github,
  Globe,
  Image,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { teamApi, hackathonApi, submissionApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Team, Round, Hackathon } from '@/types';

const baseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
});

const SubmitProject = () => {
  const { teamId, roundId } = useParams<{ teamId: string; roundId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTech, setNewTech] = useState('');
  const [additionalLinks, setAdditionalLinks] = useState<{ title: string; url: string }[]>([]);

  // Dynamic form fields based on submission type
  const [pptUrl, setPptUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
  });

  useEffect(() => {
    if (teamId && roundId) {
      fetchData();
    }
  }, [teamId, roundId]);

  const fetchData = async () => {
    try {
      const teamRes: any = await teamApi.getById(teamId!);
      setTeam(teamRes.data);

      const hackathonId = typeof teamRes.data.hackathon === 'string'
        ? teamRes.data.hackathon
        : teamRes.data.hackathon._id;

      const hackathonRes: any = await hackathonApi.getById(hackathonId);
      setHackathon(hackathonRes.data);

      const foundRound = hackathonRes.data.rounds?.find((r: Round) => r._id === roundId);
      setRound(foundRound || null);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const addTechnology = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const addLink = () => {
    setAdditionalLinks([...additionalLinks, { title: '', url: '' }]);
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...additionalLinks];
    updated[index][field] = value;
    setAdditionalLinks(updated);
  };

  const removeLink = (index: number) => {
    setAdditionalLinks(additionalLinks.filter((_, i) => i !== index));
  };

  const updateScreenshot = (index: number, value: string) => {
    const updated = [...screenshots];
    updated[index] = value;
    setScreenshots(updated);
  };

  const addScreenshot = () => {
    setScreenshots([...screenshots, '']);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    if (!round) return;

    setLoading(true);
    try {
      const submissionData: any = {
        ...data,
        teamId,
        submissionType: round.submissionType,
        technologies,
        additionalLinks: additionalLinks.filter((l) => l.title && l.url),
      };

      // Add type-specific fields
      if (round.submissionType === 'ppt' || round.submissionType === 'multiple') {
        submissionData.pptUrl = pptUrl || undefined;
      }
      if (round.submissionType === 'video' || round.submissionType === 'multiple') {
        submissionData.videoUrl = videoUrl || undefined;
      }
      if (round.submissionType === 'github' || round.submissionType === 'multiple') {
        submissionData.githubUrl = githubUrl || undefined;
      }
      if (round.submissionType === 'live_demo' || round.submissionType === 'multiple') {
        submissionData.liveDemoUrl = liveDemoUrl || undefined;
      }
      if (round.submissionType === 'screenshot' || round.submissionType === 'multiple') {
        submissionData.screenshots = screenshots.filter((s) => s.trim());
      }

      await submissionApi.create(roundId!, submissionData);

      toast({
        title: 'Submission successful!',
        description: 'Your project has been submitted.',
      });

      navigate(`/teams/${teamId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit project.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSubmissionFields = () => {
    if (!round) return null;

    const type = round.submissionType;

    return (
      <div className="space-y-4">
        {(type === 'ppt' || type === 'document' || type === 'multiple') && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Presentation/Document URL
            </Label>
            <Input
              placeholder="https://docs.google.com/presentation/..."
              value={pptUrl}
              onChange={(e) => setPptUrl(e.target.value)}
            />
          </div>
        )}

        {(type === 'video' || type === 'multiple') && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video URL
            </Label>
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        )}

        {(type === 'github' || type === 'multiple') && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Repository URL
            </Label>
            <Input
              placeholder="https://github.com/username/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        )}

        {(type === 'live_demo' || type === 'multiple') && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Live Demo URL
            </Label>
            <Input
              placeholder="https://your-demo.vercel.app"
              value={liveDemoUrl}
              onChange={(e) => setLiveDemoUrl(e.target.value)}
            />
          </div>
        )}

        {(type === 'screenshot' || type === 'multiple') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Screenshot URLs
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addScreenshot}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {screenshots.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/screenshot.png"
                  value={url}
                  onChange={(e) => updateScreenshot(index, e.target.value)}
                />
                {screenshots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeScreenshot(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Team
        </Button>

        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Submit Project</h1>
          {round && (
            <p className="text-muted-foreground">
              Submitting for Round {round.roundNumber}: {round.name}
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
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Project Details</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter your project title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                rows={4}
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Submission Content */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            Submission Content
            {round && (
              <Badge variant="outline" className="ml-2">
                {round.submissionType.replace('_', ' ')}
              </Badge>
            )}
          </h2>
          {renderSubmissionFields()}
        </div>

        {/* Technologies */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Technologies Used</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a technology..."
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechnology();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTechnology}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="pr-1 gap-1"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Links */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Additional Links
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addLink}>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>

          {additionalLinks.length > 0 && (
            <div className="space-y-3">
              {additionalLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Project
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
};

export default SubmitProject;
