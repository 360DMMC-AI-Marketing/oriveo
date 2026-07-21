import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import VoiceCommandBar from "@/components/VoiceCommandBar";
import OnboardingTour from "@/components/OnboardingTour";

export default function Layout() {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:border focus:rounded-lg focus:text-primary focus:font-medium">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1 p-6" role="main">
          <Outlet />
        </main>
      </div>
      <VoiceCommandBar />
      <OnboardingTour />
    </div>
  );
}
