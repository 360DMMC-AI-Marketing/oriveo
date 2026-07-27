import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import VoiceCommandBar from "@/components/VoiceCommandBar";
import OnboardingTour from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Layout() {
  const { user, token, updateUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: user?.email });
      toast.success("Verification email sent. Check your inbox.");
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setResending(false);
    }
  };

  const showBanner = user && user.emailVerified === false && !bannerDismissed;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:border focus:rounded-lg focus:text-primary focus:font-medium">
          Skip to main content
        </a>
        {showBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Mail className="h-4 w-4 shrink-0" />
              <span>Please verify your email address to access all features.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResendVerification}
                disabled={resending}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-7 text-xs"
              >
                {resending ? "Sending..." : "Resend email"}
              </Button>
              <button onClick={() => setBannerDismissed(true)} className="text-amber-600 hover:text-amber-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 p-4 sm:p-6" role="main">
          <Outlet />
        </main>
      </div>
      <VoiceCommandBar />
      <OnboardingTour />
    </div>
  );
}
