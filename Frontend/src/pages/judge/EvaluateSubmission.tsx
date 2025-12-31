import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubmissionViewer from '@/components/common/SubmissionViewer';
import Scorecard from '@/components/common/Scorecard';
import { submissionApi, evaluationApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Submission, Criteria, Round } from '@/types';

const EvaluateSubmissionEnhanced = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const response: any = await submissionApi.getById(id!);
      setSubmission(response.data);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: {
    scores: any[];
    feedback: string;
    strengths: string[];
    improvements: string[];
    status: 'draft' | 'submitted';
  }) => {
    setSubmitting(true);
    try {
      await evaluationApi.submitEvaluation(id!, data);
      
      toast({
        title: data.status === 'submitted' ? 'Evaluation submitted' : 'Draft saved',
        description:
          data.status === 'submitted'
            ? 'Your evaluation has been submitted successfully.'
            : 'Your evaluation has been saved as a draft.',
      });

      if (data.status === 'submitted') {
        navigate('/judge/evaluations');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save evaluation.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Submission not found</p>
        <Button asChild variant="outline">
          <Link to="/judge/evaluations">Back to Evaluations</Link>
        </Button>
      </div>
    );
  }

  const round = submission.round as Round;
  const criteria: Criteria[] = round?.criteria || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Evaluations
        </Button>

        <h1 className="text-2xl font-heading font-bold text-foreground">
          Evaluate Submission
        </h1>
        <p className="text-muted-foreground">
          {submission.team?.name} - {round?.name || 'Unknown Round'}
        </p>
      </motion.div>

      {/* Split View Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Submission Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto"
        >
          <SubmissionViewer submission={submission} />
        </motion.div>

        {/* Right: Scoring Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto"
        >
          {criteria.length > 0 ? (
            <Scorecard
              criteria={criteria}
              onSave={handleSave}
              isSubmitting={submitting}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No evaluation criteria defined for this round.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EvaluateSubmissionEnhanced;
