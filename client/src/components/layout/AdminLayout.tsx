import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, LogOut } from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user?.superAdmin) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
            O
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Oriveo Admin</h1>
            <p className="text-xs text-gray-500">Super Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{user.email}</span>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
