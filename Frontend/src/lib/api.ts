import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://hackflow-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  isLoggedIn: () => api.get('/auth/isLoggedIn'),
  
  resetPasswordRequest: (email: string) =>
    api.post('/auth/reset-password-request', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// User API
export const userApi = {
  getCurrentUser: () => api.get('/user/'),
  getAllUsers: () => api.get('/user/all-users'),
  getUserById: (id: string) => api.get(`/user/get-user/${id}`),
  deleteUser: (id: string) => api.post(`/user/del-user/${id}`),
  updateUserRole: (id: string, role: string) =>
    api.post(`/user/update-role/${id}`, { role }),
};

// Hackathon API
export const hackathonApi = {
  create: (data: Partial<import('../types').Hackathon>) =>
    api.post('/hackathon/create', data),
  
  getAll: () => api.get('/hackathon/'),
  
  getById: (id: string) => api.get(`/hackathon/${id}`),
  
  getJudgeHackathons: () => api.get('/hackathon/judge/assigned'),
  
  getOrganizerHackathons: () => api.get('/hackathon/organizer'),
  
  update: (id: string, data: Partial<import('../types').Hackathon>) =>
    api.post(`/hackathon/update/${id}`, data),
  
  delete: (id: string) => api.post(`/hackathon/delete/${id}`),
  
  addRound: (id: string, rounds: Partial<import('../types').Round>[]) =>
    api.post(`/hackathon/add-round/${id}`, { rounds }),
  
  updateRound: (id: string, data: Partial<import('../types').Round>) =>
    api.post(`/hackathon/update-round/${id}`, data),
  
  deleteRound: (id: string) => api.post(`/hackathon/delete-round/${id}`),
  
  assignJudge: (id: string, judgeId: string) =>
    api.post(`/hackathon/assign-judge/${id}`, { judgeId }),
  
  removeJudge: (id: string, judgeId: string) =>
    api.post(`/hackathon/remove-judge/${id}`, { judgeId }),
  
  getJudges: () => api.post('/hackathon/get-judges'),
};

// Team API
export const teamApi = {
  create: (hackathonId: string, data: Partial<import('../types').Team>) =>
    api.post(`/teams/create/${hackathonId}`, data),
  
  getByHackathon: (hackathonId: string) =>
    api.get(`/teams/hackathon/${hackathonId}`),
  
  getById: (id: string) => api.get(`/teams/${id}`),
  
  update: (id: string, data: Partial<import('../types').Team>) =>
    api.post(`/teams/update/${id}`, data),
  
  delete: (id: string) => api.post(`/teams/delete/${id}`),
  
  inviteMember: (id: string, email: string) =>
    api.post(`/teams/${id}/invite-member`, { email }),
  
  acceptInvitation: (id: string, email: string) =>
    api.post(`/teams/${id}/accept?email=${encodeURIComponent(email)}`),
  
  removeMember: (id: string, userId: string) =>
    api.post(`/teams/${id}/remove-member`, { userId }),
  
  leave: (id: string) => api.post(`/teams/${id}/leave`),
};

// Submission API
export const submissionApi = {
  create: (roundId: string, data: Partial<import('../types').Submission>) =>
    api.post(`/submissions/create/${roundId}`, data),
  
  getByRound: (roundId: string) => api.get(`/submissions/round/${roundId}`),
  
  getByHackathon: (hackathonId: string) =>
    api.get(`/submissions/hackathon/${hackathonId}`),
  
  getByTeam: (teamId: string) => api.get(`/submissions/team/${teamId}`),
  
  getById: (id: string) => api.get(`/submissions/${id}`),
  
  getSubmission: (id: string) => api.get(`/submissions/${id}`),
  
  update: (id: string, data: Partial<import('../types').Submission>) =>
    api.post(`/submissions/update/${id}`, data),
  
  delete: (id: string) => api.delete(`/submissions/${id}`),
  
  getStats: (roundId: string) => api.get(`/submissions/stats/${roundId}`),
};

// Evaluation API
export const evaluationApi = {
  evaluate: (submissionId: string, data: {
    scores: Array<{ criteria: string; score: number; comments?: string }>;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    status: 'draft' | 'submitted';
  }) => api.post(`/evaluations/evaluate/${submissionId}`, data),
  
  submitEvaluation: (submissionId: string, data: {
    scores: Array<{ criteria: string; score: number; maxScore: number; weight: number; comments?: string }>;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    status: 'draft' | 'submitted';
  }) => api.post(`/evaluations/evaluate/${submissionId}`, data),
  
  getPendingEvaluations: () => api.get('/evaluations/judge/pending'),
  
  getJudgeSubmissions: () => api.get('/evaluations/judge/submissions'),
  
  getById: (id: string) => api.get(`/evaluations/${id}`),
  
  getBySubmission: (submissionId: string) =>
    api.get(`/evaluations/submission/${submissionId}`),
  
  getJudgeEvaluationsForRound: (roundId: string) =>
    api.get(`/evaluations/judge/round/${roundId}`),
  
  getByRound: (roundId: string) => api.get(`/evaluations/round/${roundId}`),
  
  getHackathonSummary: (hackathonId: string) =>
    api.get(`/evaluations/hackathon/${hackathonId}/summary`),
  
  delete: (id: string) => api.delete(`/evaluations/${id}`),
};

// Results API
export const resultsApi = {
  calculateRound: (roundId: string) =>
    api.post(`/results/calculate/round/${roundId}`),
  
  calculateOverall: (hackathonId: string) =>
    api.post(`/results/calculate/overall/${hackathonId}`),
  
  getRoundResults: (roundId: string, published = true) =>
    api.get(`/results/round/${roundId}?published=${published}`),
  
  getOverallResults: (hackathonId: string, published = true) =>
    api.get(`/results/overall/${hackathonId}?published=${published}`),
  
  getTeamRoundResult: (teamId: string, roundId: string) =>
    api.get(`/results/team/${teamId}/round/${roundId}`),
  
  publish: (hackathonId: string, roundId?: string) =>
    api.post(`/results/publish/${hackathonId}`, roundId ? { roundId } : {}),
  
  unpublish: (hackathonId: string, roundId?: string) =>
    api.post(`/results/unpublish/${hackathonId}`, roundId ? { roundId } : {}),
  
  update: (id: string, data: { prize?: string; remarks?: string }) =>
    api.post(`/results/update/${id}`, data),
  
  deleteRound: (roundId: string) => api.delete(`/results/round/${roundId}`),
};
