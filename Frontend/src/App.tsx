import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Layouts
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public Pages
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";
import ResetPassword from "@/pages/public/ResetPassword";
import BrowseHackathons from "@/pages/public/BrowseHackathons";
import HackathonDetails from "@/pages/public/HackathonDetails";
import TeamInvite from "@/pages/public/TeamInvite";

// Participant Pages
import ParticipantDashboard from "@/pages/participant/Dashboard";
import MyHackathons from "@/pages/participant/MyHackathons";
import MyTeams from "@/pages/participant/MyTeams";
import Submissions from "@/pages/participant/Submissions";

// Organizer Pages
import OrganizerDashboard from "@/pages/organizer/Dashboard";
import OrganizerHackathons from "@/pages/organizer/Hackathons";
import CreateHackathon from "@/pages/organizer/CreateHackathon";
import ManageHackathon from "@/pages/organizer/ManageHackathon";
import OrganizerTeams from "@/pages/organizer/Teams";
import AddRound from "@/pages/organizer/AddRound";
import AssignJudges from "@/pages/organizer/AssignJudges";
import ManageResults from "@/pages/organizer/ManageResults";

// Participant Pages (additional)
import TeamWorkspace from "@/pages/participant/TeamWorkspace";
import SubmitProject from "@/pages/participant/SubmitProject";
import HackathonRegistration from "@/pages/participant/HackathonRegistration";

// Judge Pages
import JudgeDashboard from "@/pages/judge/Dashboard";
import AssignedHackathons from "@/pages/judge/AssignedHackathons";
import Evaluations from "@/pages/judge/Evaluations";
import EvaluateSubmission from "@/pages/judge/EvaluateSubmission";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import UserManagement from "@/pages/admin/UserManagement";
import AllHackathons from "@/pages/admin/AllHackathons";
import SystemSettings from "@/pages/admin/SystemSettings";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/hackathons" element={<BrowseHackathons />} />
          <Route path="/hackathons/:id" element={<HackathonDetails />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/team-invite/:teamId" element={<TeamInvite />} />

        {/* Participant Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<ParticipantDashboard />} />
          <Route path="hackathons" element={<MyHackathons />} />
          <Route path="teams" element={<MyTeams />} />
          <Route path="submissions" element={<Submissions />} />
        </Route>

        {/* Team Routes (Protected for participants) */}
        <Route path="/teams/:teamId" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<TeamWorkspace />} />
          <Route path="submit/:roundId" element={<SubmitProject />} />
        </Route>

        {/* Hackathon Registration (Protected) */}
        <Route path="/participant/hackathons/:id/register" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<HackathonRegistration />} />
        </Route>

        {/* Organizer Dashboard */}
        <Route path="/organizer" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<OrganizerDashboard />} />
          <Route path="hackathons" element={<OrganizerHackathons />} />
          <Route path="hackathons/create" element={<CreateHackathon />} />
          <Route path="hackathons/:id" element={<ManageHackathon />} />
          <Route path="hackathons/:id/rounds" element={<AddRound />} />
          <Route path="hackathons/:id/judges" element={<AssignJudges />} />
          <Route path="hackathons/:id/results" element={<ManageResults />} />
          <Route path="teams" element={<OrganizerTeams />} />
        </Route>

        {/* Judge Dashboard */}
        <Route path="/judge" element={<ProtectedRoute allowedRoles={['judge', 'admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<JudgeDashboard />} />
          <Route path="hackathons" element={<AssignedHackathons />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="evaluate/:id" element={<EvaluateSubmission />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="hackathons" element={<AllHackathons />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
