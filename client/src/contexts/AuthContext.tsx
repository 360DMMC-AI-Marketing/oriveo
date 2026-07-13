import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  profession: string;
  specialty: string[];
  language: string;
  superAdmin?: boolean;
  organization?: { _id: string; name: string; slug: string; type?: string } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role?: string; phone?: string; profession?: string; specialty?: string; clinicName?: string; clinicSlug?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("oriveo_token");
    const savedUser = localStorage.getItem("oriveo_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("oriveo_token", data.token);
    localStorage.setItem("oriveo_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (signupData: any) => {
    const { data } = await api.post("/auth/signup", signupData);
    localStorage.setItem("oriveo_token", data.token);
    localStorage.setItem("oriveo_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore server error — still clear local session
    }
    disconnectSocket();
    localStorage.removeItem("oriveo_token");
    localStorage.removeItem("oriveo_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
