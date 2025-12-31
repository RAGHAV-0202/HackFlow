export type UserRole = 'participant' | 'judge' | 'organizer' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  teams?: string[];
  hackathonsJoined?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Prize {
  position: string;
  reward: string;
}

export interface Criteria {
  _id: string;
  name: string;
  description?: string;
  round: string;
  weight: number;
  maxScore: number;
  order: number;
}

export interface Round {
  _id: string;
  name: string;
  description?: string;
  hackathon: string;
  roundNumber: number;
  submissionType: 'ppt' | 'video' | 'github' | 'live_demo' | 'screenshot' | 'document' | 'multiple';
  startDate: string;
  endDate: string;
  maxMarks: number;
  criteria: Criteria[];
  submissions: string[];
}

export interface InvitedMember {
  user?: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedAt: string;
}

export interface Team {
  _id: string;
  name: string;
  hackathon: string | Hackathon;
  leader: User | string;
  members: User[];
  invitedMembers: InvitedMember[];
  submissions: string[];
  projectName?: string;
  projectDescription?: string;
  technologies?: string[];
  createdAt?: string;
}

export interface Hackathon {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  maxTeamSize: number;
  maxParticipants?: number;
  organizer: User | string;
  judges: User[];
  participants: User[];
  rounds: Round[];
  teams: Team[];
  prizes: Prize[];
  banner?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Link {
  title: string;
  url: string;
}

export interface Submission {
  _id: string;
  team: Team;
  round: Round;
  hackathon: string;
  title: string;
  description: string;
  submissionType: string;
  pptUrl?: string;
  videoUrl?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  screenshots?: string[];
  documentUrl?: string;
  additionalLinks?: Link[];
  technologies?: string[];
  submittedBy: User;
  submittedAt: string;
  isLateSubmission: boolean;
  evaluations: Evaluation[];
  totalScore: number;
  averageScore: number;
  evaluationStatus: 'pending' | 'in_progress' | 'completed';
  status: 'draft' | 'submitted' | 'under_review' | 'evaluated';
}

export interface Score {
  criteria: Criteria | string;
  score: number;
  maxScore: number;
  weight: number;
  comments?: string;
}

export interface Evaluation {
  _id: string;
  submission: string | Submission;
  judge: User;
  round: string;
  scores: Score[];
  totalScore: number;
  weightedScore: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  evaluatedAt: string;
  status: 'draft' | 'submitted';
}

export interface RoundScore {
  round: string;
  score: number;
  rank: number;
}

export interface Result {
  _id: string;
  hackathon: string;
  round?: string;
  team: Team;
  submission?: string;
  totalScore: number;
  averageScore: number;
  weightedScore: number;
  rank: number;
  roundScores?: RoundScore[];
  prize?: string;
  resultType: 'round' | 'overall';
  isPublished: boolean;
  publishedAt?: string;
  remarks?: string;
}

export interface AuthResponse {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    userId: string;
    role: UserRole;
  };
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
}
