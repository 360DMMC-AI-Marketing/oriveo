import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import VoiceCommandBar from "@/components/VoiceCommandBar";

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
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <VoiceCommandBar />
    </div>
  );
}
