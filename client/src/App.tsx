import { lazy, Suspense, Component, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">!</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-4">An unexpected error occurred. Please try refreshing the page.</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return <div className="flex min-h-screen items-center justify-center"><div className="text-lg text-gray-500">Loading...</div></div>;
}

const Layout = lazy(() => import("@/components/layout/Layout"));
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const Landing = lazy(() => import("@/pages/Landing"));
const Features = lazy(() => import("@/pages/Features"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Contact = lazy(() => import("@/pages/Contact"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/SignupWizard"));
const StaticPage = lazy(() => import("@/pages/StaticPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const MedicalTemplates = lazy(() => import("@/pages/MedicalTemplates"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const CalendarSchedule = lazy(() => import("@/pages/CalendarSchedule"));
const CallDetail = lazy(() => import("@/pages/CallDetail"));
const ClinicDashboard = lazy(() => import("@/pages/ClinicDashboard"));
const ClinicUsers = lazy(() => import("@/pages/ClinicUsers"));
const CallCenter = lazy(() => import("@/pages/CallCenter"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const CallReview = lazy(() => import("@/pages/CallReview"));
const AuditLog = lazy(() => import("@/pages/AuditLog"));
const Reports = lazy(() => import("@/pages/Reports"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const CommandCenter = lazy(() => import("@/pages/CommandCenter"));
const Admin = lazy(() => import("@/pages/Admin"));
const PatientBooking = lazy(() => import("@/pages/PatientBooking"));
const OnboardingGuide = lazy(() => import("@/pages/OnboardingGuide"));
const AdminAvailability = lazy(() => import("@/pages/AdminAvailability"));
const CalendarSettings = lazy(() => import("@/pages/CalendarSettings"));
const MyProfile = lazy(() => import("@/pages/MyProfile"));
const Rooms = lazy(() => import("@/pages/Rooms"));
const Departments = lazy(() => import("@/pages/Departments"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/departments" element={<Departments />} />
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
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
