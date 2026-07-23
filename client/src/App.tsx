import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/layout/AdminLayout";
import Landing from "@/pages/Landing";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/SignupWizard";
import StaticPage from "@/pages/StaticPage";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import MedicalTemplates from "@/pages/MedicalTemplates";
import Appointments from "@/pages/Appointments";
import CalendarSchedule from "@/pages/CalendarSchedule";
import CallDetail from "@/pages/CallDetail";
import ClinicDashboard from "@/pages/ClinicDashboard";
import ClinicSettingsPage from "@/pages/ClinicSettings";
import ClinicUsers from "@/pages/ClinicUsers";

import CallCenter from "@/pages/CallCenter";
import Analytics from "@/pages/Analytics";
import KnowledgeBase from "@/pages/KnowledgeBase";
import CallReview from "@/pages/CallReview";

import AuditLog from "@/pages/AuditLog";
import Reports from "@/pages/Reports";
import Notifications from "@/pages/Notifications";
import CommandCenter from "@/pages/CommandCenter";
import Admin from "@/pages/Admin";
import PatientBooking from "@/pages/PatientBooking";
import OnboardingGuide from "@/pages/OnboardingGuide";
import AdminAvailability from "@/pages/AdminAvailability";
import CalendarSettings from "@/pages/CalendarSettings";
import MyProfile from "@/pages/MyProfile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-lg text-gray-500">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.superAdmin ? "/admin" : "/clinic"} />;
  return <>{children}</>;
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.superAdmin ? "/admin" : "/clinic"} />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/:page" element={<StaticPage />} />
      <Route path="/book/:token" element={<PatientBooking />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/templates" element={<MedicalTemplates />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/calendar" element={<CalendarSchedule />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/calls/:id" element={<CallDetail />} />
        <Route path="/users" element={<Navigate to="/clinic/users" replace />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/voice-agent" element={<CallCenter />} />
        <Route path="/schedule-call" element={<CallCenter />} />
        <Route path="/call-review" element={<CallReview />} />
        <Route path="/inbound-calls" element={<Navigate to="/voice-agent" replace />} />
        <Route path="/live-monitoring" element={<Navigate to="/voice-agent" replace />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />

        <Route path="/clinic" element={<ClinicDashboard />} />
        <Route path="/clinic/settings" element={<ClinicSettingsPage />} />
        <Route path="/clinic/users" element={<ClinicUsers />} />

        <Route path="/onboarding-guide" element={<OnboardingGuide />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin/availability" element={<AdminAvailability />} />
        <Route path="/settings/calendar" element={<CalendarSettings />} />
        <Route path="/recordings" element={<Navigate to="/call-review" replace />} />
        <Route path="/ai-qa" element={<Navigate to="/call-review" replace />} />
      </Route>
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
