import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubmissionViewer from '@/components/common/SubmissionViewer';
import Scorecard from '@/components/common/Scorecard';
import { evaluationApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Submission, Criteria, Round, Score } from '@/types';

interface EvaluationData {
  scores: Score[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  status: 'draft' | 'submitted';
}

const EvaluateSubmissionEnhanced = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmissionData();
    }
  }, [id]);

  const fetchSubmissionData = async () => {
    try {
      // Fetch submission using judge endpoint and check for existing evaluation in parallel
      const [submissionResponse, evaluationsResponse]: any = await Promise.all([
        evaluationApi.getJudgeSubmissionById(id!),
        evaluationApi.getBySubmission(id!).catch(() => ({ data: { evaluations: [] } }))
      ]);

      // API returns { data: {...} } structure
      const submissionData = submissionResponse?.data || submissionResponse;
      setSubmission(submissionData);

      // Check for existing evaluation by current judge
      const evaluations = evaluationsResponse?.data?.evaluations || evaluationsResponse?.evaluations || [];
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && evaluations.length > 0) {
        try {
          const user = JSON.parse(userStr);
          const myEvaluation = evaluations.find((e: any) => 
            e.judge?._id === user._id || e.judge === user._id
          );
          if (myEvaluation) {
            setExistingEvaluation(myEvaluation);
          }
        } catch (parseError) {
          console.warn('Failed to parse user from localStorage:', parseError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submission data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: EvaluationData) => {
    if (!id) return;
    
    setSubmitting(true);
    try {
      // Transform scores to match backend expected format
      const formattedScores = data.scores.map(score => ({
        criteria: typeof score.criteria === 'string' ? score.criteria : score.criteria._id,
        score: score.score,
        maxScore: score.maxScore,
        weight: score.weight,
        comments: score.comments || ''
      }));

      await evaluationApi.submitEvaluation(id, {
        scores: formattedScores,
        feedback: data.feedback,
        strengths: data.strengths,
        improvements: data.improvements,
        status: data.status
      });
      
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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save evaluation.';
      toast({
        title: 'Error',
        description: errorMessage,
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
  // Handle criteria - can be populated objects or just IDs
  const criteria: Criteria[] = round?.criteria?.filter((c): c is Criteria => 
    typeof c === 'object' && c !== null && '_id' in c
  ) || [];

  // Get initial values from existing evaluation - handle nested data structure
  const initialScores = existingEvaluation?.scores || existingEvaluation?.data?.scores || [];
  const initialFeedback = existingEvaluation?.feedback || existingEvaluation?.data?.feedback || '';
  const initialStrengths = existingEvaluation?.strengths || existingEvaluation?.data?.strengths || [];
  const initialImprovements = existingEvaluation?.improvements || existingEvaluation?.data?.improvements || [];
  
  // Check if evaluation is already submitted (read-only mode)
  // Check both the evaluation status and submission's evaluationStatus
  const isReadOnly = existingEvaluation?.status === 'submitted' || submission?.evaluationStatus === 'completed';

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
          {isReadOnly ? 'View Evaluation' : existingEvaluation ? 'Edit Evaluation' : 'Evaluate Submission'}
        </h1>
        <p className="text-muted-foreground">
          {submission.team?.name} - {round?.name || 'Unknown Round'}
          {isReadOnly && <span className="ml-2 text-success">(Submitted)</span>}
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
              initialScores={initialScores}
              initialFeedback={initialFeedback}
              initialStrengths={initialStrengths}
              initialImprovements={initialImprovements}
              onSave={isReadOnly ? undefined : handleSave}
              isSubmitting={submitting}
              readOnly={isReadOnly}
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
