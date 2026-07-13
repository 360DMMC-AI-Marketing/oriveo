import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Phone, Activity, CreditCard, Calendar, BarChart3, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Link } from "react-router-dom";

const PLAN_FEATURES: Record<string, { label: string; price: string; features: string[] }> = {
  starter: {
    label: "Starter",
    price: "$99/mo",
    features: ["5 team members", "500 patients", "1,000 calls/mo", "Email support"],
  },
  pro: {
    label: "Pro",
    price: "$299/mo",
    features: ["25 team members", "5,000 patients", "10,000 calls/mo", "Priority support", "EHR integration", "Custom branding"],
  },
  enterprise: {
    label: "Enterprise",
    price: "Custom",
    features: ["Unlimited members", "Unlimited patients", "Unlimited calls", "Dedicated support", "SLA guarantee", "On-premise option"],
  },
};

export default function ClinicDashboard() {
  const { user } = useAuth();
  const { data: orgData, isLoading: loadingOrg } = useQuery({
    queryKey: ["org", "settings"],
    queryFn: () => api.get("/org/settings").then(r => r.data),
  });
  const { data: billing, isLoading: loadingBilling } = useQuery({
    queryKey: ["org", "billing"],
    queryFn: () => api.get("/org/billing").then(r => r.data),
  });

  if (loadingOrg || loadingBilling) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  const org = orgData?.organization;
  const usage = billing?.usage;
  const sub = billing?.subscription;
  const plan = PLAN_FEATURES[sub?.plan] || PLAN_FEATURES.starter;
  const maxCalls = sub?.limits?.maxMonthlyCalls || 1000;
  const maxUsers = sub?.limits?.maxUsers || 5;
  const maxPatients = sub?.limits?.maxPatients || 500;
  const callPercent = usage?.calls ? Math.min(100, Math.round((usage.calls / maxCalls) * 100)) : 0;
  const userPercent = usage?.users ? Math.min(100, Math.round((usage.users / maxUsers) * 100)) : 0;
  const patientPercent = usage?.patients ? Math.min(100, Math.round((usage.patients / maxPatients) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org?.name || "Clinic"} Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <CreditCard className="h-4 w-4" />
          {sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : "Free"} Plan
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Team Members</p>
              <p className="text-xl font-bold">{usage?.users ?? 0}</p>
              <p className="text-xs text-gray-400">of {sub?.limits?.maxUsers ?? 5}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Patients</p>
              <p className="text-xl font-bold">{usage?.patients ?? 0}</p>
              <p className="text-xs text-gray-400">of {sub?.limits?.maxPatients ?? 500}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="w-8 h-8 text-cyan-600" />
            <div>
              <p className="text-xs text-gray-500">Total Calls</p>
              <p className="text-xl font-bold">{usage?.calls ?? 0}</p>
              <p className="text-xs text-gray-400">this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500">Plan Status</p>
              <p className={`text-xl font-bold capitalize ${sub?.status === "active" ? "text-green-600" : "text-red-600"}`}>{sub?.status || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/patients" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Manage Patients</span>
            </Link>
            <Link to="/voice-agent" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
              <Phone className="h-5 w-5 text-cyan-600" />
              <span className="text-sm font-medium">Start a Call</span>
            </Link>
            <Link to="/clinic/users" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Invite Team Members</span>
            </Link>
            <Link to="/clinic/settings" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">Clinic Settings</span>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> At a Glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Default Language</span>
              <span className="text-sm font-medium">{(org?.settings?.defaultLanguage || "en").toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Timezone</span>
              <span className="text-sm font-medium">{org?.settings?.timezone || "America/New_York"}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Plan</span>
              <span className="text-sm font-medium capitalize">{sub?.plan || "starter"}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-sm font-medium capitalize ${sub?.status === "active" ? "text-green-600" : "text-red-600"}`}>{sub?.status || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {plan.label} Plan — {plan.price}
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
            sub?.status === "active" ? "bg-green-100 text-green-700" :
            sub?.status === "trialing" ? "bg-blue-100 text-blue-700" :
            "bg-red-100 text-red-700"
          }`}>{sub?.status}</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Plan Features</p>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {sub?.plan !== "enterprise" && (
                <Button variant="outline" className="mt-4 gap-1" onClick={() => window.location.href = "/clinic/billing"}>
                  Upgrade Plan <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Usage this month</p>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Calls</span>
                  <span className="font-medium">{usage?.calls ?? 0} / {maxCalls}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${callPercent > 80 ? "bg-red-500" : callPercent > 50 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${callPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Team Members</span>
                  <span className="font-medium">{usage?.users ?? 0} / {maxUsers}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${userPercent > 80 ? "bg-red-500" : userPercent > 50 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${userPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Patients</span>
                  <span className="font-medium">{usage?.patients ?? 0} / {maxPatients}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${patientPercent > 80 ? "bg-red-500" : patientPercent > 50 ? "bg-amber-500" : "bg-purple-500"}`}
                    style={{ width: `${patientPercent}%` }} />
                </div>
              </div>
              {sub && (
                <div className="pt-2 border-t text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between"><span>Started</span><span>{new Date(sub.startDate).toLocaleDateString()}</span></div>
                  {sub.endDate && <div className="flex justify-between"><span>Ends</span><span>{new Date(sub.endDate).toLocaleDateString()}</span></div>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
