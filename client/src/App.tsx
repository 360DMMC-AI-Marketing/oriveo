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
import Rooms from "@/pages/Rooms";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-lg text-gray-500">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role) && !user.superAdmin) return <Navigate to="/dashboard" replace />;
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
        <Route path="/templates" element={<ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}><MedicalTemplates /></ProtectedRoute>} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/calendar" element={<CalendarSchedule />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/calls/:id" element={<CallDetail />} />
        <Route path="/users" element={<Navigate to="/clinic/users" replace />} />
        <Route path="/audit-log" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLog /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "doctor", "nurse", "receptionist"]}><Reports /></ProtectedRoute>} />
        <Route path="/voice-agent" element={<ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}><CallCenter /></ProtectedRoute>} />
        <Route path="/schedule-call" element={<ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}><CallCenter /></ProtectedRoute>} />
        <Route path="/call-review" element={<ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}><CallReview /></ProtectedRoute>} />
        <Route path="/inbound-calls" element={<Navigate to="/voice-agent" replace />} />
        <Route path="/live-monitoring" element={<Navigate to="/voice-agent" replace />} />
        <Route path="/command-center" element={<ProtectedRoute allowedRoles={["admin", "doctor"]}><CommandCenter /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "doctor"]}><Analytics /></ProtectedRoute>} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />

        <Route path="/clinic" element={<ClinicDashboard />} />
        <Route path="/clinic/settings" element={<Navigate to="/clinic" replace />} />
        <Route path="/clinic/users" element={<ProtectedRoute allowedRoles={["admin"]}><ClinicUsers /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute allowedRoles={["admin", "doctor"]}><Rooms /></ProtectedRoute>} />

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
