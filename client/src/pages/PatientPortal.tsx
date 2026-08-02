import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  HeartPulse, Loader2, CalendarDays, FlaskConical, Pill, LogOut,
  KeyRound, ChevronRight, Mail, ShieldCheck, Home,
} from "lucide-react";

const TOKEN_KEY = "oriveo_patient_token";
const papi = axios.create({ baseURL: "/api/patient-auth", headers: { "Content-Type": "application/json" } });
papi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Tab = "overview" | "appointments" | "labs" | "prescriptions";

const TEST_STATUS: Record<string, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  high: { label: "High", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  low: { label: "Low", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  critical: { label: "Critical", cls: "text-red-700 bg-red-50 border-red-200" },
  pending: { label: "Pending", cls: "text-gray-500 bg-gray-50 border-gray-200" },
};

const APPT_STATUS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  "no-show": "bg-amber-50 text-amber-700 border-amber-200",
};

function Login({ onLoggedIn }: { onLoggedIn: (patient: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<"login" | "forgot">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await papi.post("/login", { email, password });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      onLoggedIn(res.data.patient);
      toast.success("Welcome back");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await papi.post("/forgot-password", { email: resetEmail });
      toast.success("If an account exists, a reset link was generated. Contact your clinic for the reset link.");
      setView("login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg"><HeartPulse size={26} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
            <p className="text-sm text-gray-500">Your health, appointments and results</p>
          </div>
        </div>
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {view === "login" ? (
              <form onSubmit={login} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <KeyRound className="h-4 w-4 mr-1" />} Sign In
                </Button>
                <button type="button" onClick={() => setView("forgot")} className="w-full text-center text-sm text-emerald-600 hover:underline">
                  Forgot password?
                </button>
                <p className="text-xs text-center text-gray-400 pt-2">Need access? Ask your clinic to enable your portal account.</p>
              </form>
            ) : (
              <form onSubmit={forgot} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@email.com" className="mt-1" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />} Send Reset Link
                </Button>
                <button type="button" onClick={() => setView("login")} className="w-full text-center text-sm text-gray-500 hover:underline">
                  Back to login
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PatientPortal() {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("oriveo_patient");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState<Tab>("overview");
  const [showChangePw, setShowChangePw] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const { data: appts } = useQuery({
    queryKey: ["patient", "appointments"],
    queryFn: () => papi.get("/appointments").then(r => r.data),
    enabled: !!patient,
  });
  const { data: labs } = useQuery({
    queryKey: ["patient", "labs"],
    queryFn: () => papi.get("/labs").then(r => r.data),
    enabled: !!patient,
  });
  const { data: rx } = useQuery({
    queryKey: ["patient", "prescriptions"],
    queryFn: () => papi.get("/prescriptions").then(r => r.data),
    enabled: !!patient,
  });

  const changePw = useMutation({
    mutationFn: (body: any) => papi.post("/change-password", body),
    onSuccess: () => { toast.success("Password updated"); setShowChangePw(false); setPw({ currentPassword: "", newPassword: "" }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update password"),
  });

  if (!patient) return <Login onLoggedIn={(p) => { localStorage.setItem("oriveo_patient", JSON.stringify(p)); setPatient(p); }} />;

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("oriveo_patient");
    queryClient.clear();
    setPatient(null);
  };

  const upcoming = (appts?.appointments || []).filter((a: any) => ["scheduled", "confirmed"].includes(a.status));
  const appointments = appts?.appointments || [];
  const labResults = labs?.results || [];
  const prescriptions = rx?.prescriptions || [];

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "appointments", label: "Appointments", icon: CalendarDays, count: appointments.length },
    { id: "labs", label: "Lab Results", icon: FlaskConical, count: labResults.length },
    { id: "prescriptions", label: "Prescriptions", icon: Pill, count: prescriptions.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white"><HeartPulse size={20} /></div>
            <div>
              <p className="font-semibold text-gray-900">{patient.name}</p>
              <p className="text-xs text-gray-500">{patient.clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChangePw(true)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"><KeyRound size={14} /> Password</button>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-1 border-b mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === t.id ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
              {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-xs">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1"><CalendarDays size={13} /> Next Appointment</p>
              {upcoming[0] ? (
                <div>
                  <p className="font-semibold text-gray-900">{new Date(upcoming[0].date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-sm text-gray-500 mt-1">{upcoming[0].time} {upcoming[0].provider?.name ? `· ${upcoming[0].provider.name}` : ""}</p>
                </div>
              ) : <p className="text-sm text-gray-500">No upcoming appointments.</p>}
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1"><FlaskConical size={13} /> Lab Results</p>
              <p className="font-semibold text-gray-900">{labResults.length}</p>
              <p className="text-sm text-gray-500 mt-1">results on file</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1"><Pill size={13} /> Active Prescriptions</p>
              <p className="font-semibold text-gray-900">{prescriptions.filter((p: any) => p.status === "active").length}</p>
              <p className="text-sm text-gray-500 mt-1">currently active</p>
            </CardContent></Card>
          </div>
        )}

        {tab === "appointments" && (
          appointments.length === 0 ? <Empty text="No appointments yet." /> : (
            <div className="space-y-3">
              {appointments.map((a: any) => (
                <Card key={a._id}><CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(a.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{a.time} {a.provider?.name ? `· ${a.provider.name}` : ""}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${APPT_STATUS[a.status] || "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        )}

        {tab === "labs" && (
          labResults.length === 0 ? <Empty text="No lab results yet." /> : (
            <div className="space-y-3">
              {labResults.map((r: any) => (
                <Card key={r._id}><CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-900">{r.panel}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${APPT_STATUS.completed}`}>{r.status}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-gray-500 text-xs"><th className="pb-2 font-medium">Test</th><th className="pb-2 font-medium">Value</th><th className="pb-2 font-medium">Reference</th><th className="pb-2 font-medium">Status</th></tr></thead>
                      <tbody>
                        {r.tests.map((t: any, i: number) => {
                          const st = TEST_STATUS[t.status] || TEST_STATUS.pending;
                          return (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 font-medium text-gray-800">{t.name}</td>
                              <td className="py-2 text-gray-700">{t.value} {t.unit}</td>
                              <td className="py-2 text-gray-400">{t.referenceLow && t.referenceHigh ? `${t.referenceLow}–${t.referenceHigh}` : "—"}</td>
                              <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>{st.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        )}

        {tab === "prescriptions" && (
          prescriptions.length === 0 ? <Empty text="No prescriptions yet." /> : (
            <div className="space-y-3">
              {prescriptions.map((p: any) => (
                <Card key={p._id}><CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{p.medication} {p.dosage && <span className="text-gray-500 font-normal">· {p.dosage}</span>}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{p.frequency} {p.route && <span className="capitalize">· {p.route}</span>} {p.refills > 0 && `· ${p.refills} refill(s)`}</p>
                      {p.instructions && <p className="text-sm text-gray-600 mt-1">{p.instructions}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${APPT_STATUS.scheduled}`}>{p.status}</span>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        )}
      </div>

      {showChangePw && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowChangePw(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button onClick={() => setShowChangePw(false)} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={18} className="rotate-90" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><Label>Current Password</Label><Input type="password" value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} className="mt-1" /></div>
              <div><Label>New Password</Label><Input type="password" value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} className="mt-1" /></div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!pw.currentPassword || pw.newPassword.length < 6} onClick={() => changePw.mutate(pw)}>
                {changePw.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-4 w-4 mr-1" />} Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="p-12 text-center text-gray-500">{text}</CardContent></Card>;
}
