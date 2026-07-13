import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import LanguageSelect from "@/components/LanguageSelect";
import {
  Building2, Users, Phone, CreditCard, Activity, Shield,
  Plus, X, CheckCircle2, XCircle,
  BarChart3, RefreshCw, Loader2, AlertTriangle,
  Settings, Eye, EyeOff, Save
} from "lucide-react";

type Tab = "organizations" | "subscriptions" | "analytics" | "health" | "settings";

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("settings");
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  if (!user?.superAdmin) {
    return <div className="text-center text-gray-500 mt-20">Super admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Super Admin</h1>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(["organizations", "subscriptions", "analytics", "health", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t text-sm font-medium capitalize ${
              tab === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t === "organizations" && <Building2 className="inline w-4 h-4 mr-1" />}
            {t === "subscriptions" && <CreditCard className="inline w-4 h-4 mr-1" />}
            {t === "analytics" && <BarChart3 className="inline w-4 h-4 mr-1" />}
            {t === "health" && <Activity className="inline w-4 h-4 mr-1" />}
            {t === "settings" && <Settings className="inline w-4 h-4 mr-1" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "organizations" && <OrganizationsTab onCreate={() => setShowCreateOrg(true)} showCreate={showCreateOrg} onClose={() => setShowCreateOrg(false)} />}
      {tab === "subscriptions" && <SubscriptionsTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "health" && <HealthTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function OrganizationsTab({ onCreate, showCreate, onClose }: { onCreate: () => void; showCreate: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => api.get("/admin/organizations").then(r => r.data),
  });

  const updateOrg = useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/admin/organizations/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] }); toast.success("Organization updated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deleteOrg = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/organizations/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] }); toast.success("Organization deleted"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.length || 0} organizations</p>
        <Button size="sm" onClick={onCreate}><Plus className="w-4 h-4 mr-1" /> Add Organization</Button>
      </div>

      {showCreate && <CreateOrgForm onClose={onClose} />}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-3">
          {data?.map((org: any) => (
            <Card key={org._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{org.name}</h3>
                      <p className="text-xs text-gray-500">/{org.slug} &middot; Created {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span title="Users"><Users className="w-3.5 h-3.5 inline mr-0.5" />{org.stats?.users ?? 0}</span>
                    <span title="Patients"><Users className="w-3.5 h-3.5 inline mr-0.5" />{org.stats?.patients ?? 0}</span>
                    <span title="Calls"><Phone className="w-3.5 h-3.5 inline mr-0.5" />{org.stats?.calls ?? 0}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      org.subscription?.status === "active" ? "bg-green-100 text-green-700" :
                      org.subscription?.status === "suspended" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {org.subscription?.status || "no sub"}
                    </span>
                    {org.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" aria-label="Active" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" aria-label="Inactive" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateOrg.mutate({ id: org._id, isActive: !org.isActive })}>
                    {org.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => { if (confirm("Delete this organization?")) deleteOrg.mutate(org._id); }}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateOrgForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [defaultLanguage, setDefaultLanguage] = useState("en");

  const createOrg = useMutation({
    mutationFn: (body: any) => api.post("/admin/organizations", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success("Organization created");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const autoSlug = (v: string) => setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

  return (
    <Card className="border-blue-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">New Organization</h4>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Name</label>
            <Input value={name} onChange={e => { setName(e.target.value); autoSlug(e.target.value); }} placeholder="Clinic Name" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Slug</label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="clinic-name" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full border rounded p-2 text-sm">
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Default Language</label>
          <LanguageSelect value={defaultLanguage} onChange={setDefaultLanguage} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => createOrg.mutate({ name, slug, plan, settings: { defaultLanguage } })} disabled={!name || !slug || createOrg.isPending}>
            {createOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => api.get("/admin/subscriptions").then(r => r.data),
  });

  const updateSub = useMutation({
    mutationFn: ({ orgId, ...body }: any) => api.put(`/admin/subscriptions/${orgId}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }); toast.success("Subscription updated"); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Organization</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Users</th>
                <th className="pb-2 font-medium">Monthly Calls</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((sub: any) => (
                <tr key={sub._id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{sub.organization?.name || "N/A"} <span className="text-xs text-gray-400">/{sub.organization?.slug}</span></td>
                  <td className="py-2 capitalize">{sub.plan}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sub.status === "active" ? "bg-green-100 text-green-700" :
                      sub.status === "suspended" ? "bg-red-100 text-red-700" :
                      sub.status === "trialing" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{sub.status}</span>
                  </td>
                  <td className="py-2">{sub.limits?.maxUsers ?? "-"}</td>
                  <td className="py-2">{sub.limits?.maxMonthlyCalls ?? "-"}</td>
                  <td className="py-2 flex gap-1">
                    {sub.status !== "suspended" ? (
                      <Button size="sm" variant="outline" className="text-red-600 text-xs" onClick={() => updateSub.mutate({ orgId: sub.organization?._id, status: "suspended" })}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-green-600 text-xs" onClick={() => updateSub.mutate({ orgId: sub.organization?._id, status: "active" })}>
                        Reactivate
                      </Button>
                    )}
                    {sub.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className="text-red-600 text-xs" onClick={() => updateSub.mutate({ orgId: sub.organization?._id, status: "cancelled" })}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api.get("/admin/analytics/overview").then(r => r.data),
  });

  const metrics = data ? [
    { label: "Organizations", value: data.totalOrganizations, icon: Building2, color: "text-blue-600" },
    { label: "Active Subscriptions", value: data.activeSubscriptions, icon: CreditCard, color: "text-green-600" },
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "text-purple-600" },
    { label: "Total Patients", value: data.totalPatients, icon: Users, color: "text-orange-600" },
    { label: "Total Calls", value: data.totalCalls, icon: Phone, color: "text-cyan-600" },
    { label: "Calls (30d)", value: data.callsLast30Days, icon: Phone, color: "text-indigo-600" },
    { label: "Events (30d)", value: data.eventsLast30Days, icon: Activity, color: "text-rose-600" },
    { label: "Error Rate", value: data.callsByStatus?.failed ? `${((data.callsByStatus.failed / (data.callsLast30Days || 1)) * 100).toFixed(1)}%` : "0%", icon: AlertTriangle, color: data.callsByStatus?.failed > 0 ? "text-red-600" : "text-green-600" },
  ] : [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <m.icon className={`w-8 h-8 ${m.color}`} />
                  <div>
                    <p className="text-xs text-gray-500">{m.label}</p>
                    <p className="text-xl font-bold">{m.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data?.callsByOrg?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Calls by Organization (30d)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.callsByOrg.map((o: any) => (
                    <div key={o._id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{o._id || "Unassigned"}</span>
                      <span className="font-medium">{o.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function HealthTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => api.get("/admin/health").then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Auto-refreshes every 30s</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : data ? (
        <>
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${data.healthy ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <Shield className={`w-6 h-6 ${data.healthy ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className={`font-semibold ${data.healthy ? "text-green-700" : "text-red-700"}`}>
                {data.healthy ? "All Systems Healthy" : "Issues Detected"}
              </p>
              <p className="text-xs text-gray-500">Last 30 minutes</p>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Services Status</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.services?.map((s: any) => {
                  const colorMap: Record<string, string> = {
                    ok: "bg-green-50 border-green-200",
                    disabled: "bg-gray-50 border-gray-200",
                    error: "bg-red-50 border-red-200",
                  };
                  const dotMap: Record<string, string> = {
                    ok: "bg-green-500",
                    disabled: "bg-gray-400",
                    error: "bg-red-500",
                  };
                  return (
                    <div key={s.name} className={`flex items-center gap-2 p-3 rounded-lg border ${colorMap[s.status] || "bg-gray-50 border-gray-200"}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${dotMap[s.status] || "bg-gray-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.message || s.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Total Calls</p>
                <p className="text-xl font-bold">{data.totalCalls}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Failed Calls</p>
                <p className="text-xl font-bold text-red-600">{data.failedCalls}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Error Rate</p>
                <p className="text-xl font-bold">{data.errorRate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Error Events</p>
                <p className="text-xl font-bold text-orange-600">{data.errorEvents}</p>
              </CardContent>
            </Card>
          </div>

          {data.orgStatuses && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Subscription Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.orgStatuses).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

const SETTINGS_KEYS = [
  { key: "TWILIO_ACCOUNT_SID",       label: "Twilio Account SID",       placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",     masked: true },
  { key: "TWILIO_AUTH_TOKEN",        label: "Twilio Auth Token",        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",         masked: true },
  { key: "TWILIO_PHONE_NUMBER",      label: "Twilio Phone Number",      placeholder: "+15551234567",                             masked: false },
  { key: "CLINIC_EMERGENCY_NUMBER",  label: "Clinic Emergency Number",  placeholder: "+212xxxxxxxxx (dialed on emergency call)",  masked: false },
  { key: "HUMAN_TRANSFER_NUMBER",    label: "Human Transfer Number",    placeholder: "+15551234567",                             masked: false },
   { key: "PRACTICE_NAME",            label: "Practice Name",            placeholder: "Oriveo Medical",                         masked: false },
  { key: "ON_CALL_PHONE",            label: "On-Call Phone",            placeholder: "+15551234567",                             masked: false },
];

function SettingsTab() {
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get("/admin/settings").then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      api.put("/admin/settings", { configs: settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const loadEnvMutation = useMutation({
    mutationFn: () => api.get("/admin/settings/environment").then((r) => r.data),
    onSuccess: (res) => {
      const env = res.env as Record<string, string>;
      setConfigs((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(env)) {
          if (env[k]) next[k] = env[k];
        }
        return next;
      });
      toast.success("Loaded from environment variables");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  const serverConfigs = data?.configs || [];
  if (!configs.TWILIO_ACCOUNT_SID && serverConfigs.length > 0) {
    const initial: Record<string, string> = {};
    for (const c of serverConfigs) {
      initial[c.key] = c.value || "";
    }
    if (Object.keys(configs).length === 0) {
      setConfigs(initial);
    }
  }

  const handleSave = () => {
    const entries = Object.entries(configs).map(([key, value]) => ({ key, value }));
    saveMutation.mutate(entries);
  };

  const handleChange = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Server Configuration</h2>
          <p className="text-sm text-gray-500">Configure Twilio, emergency numbers, and other server settings.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEnvMutation.mutate()}
            disabled={loadEnvMutation.isPending}
            className="gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadEnvMutation.isPending ? "animate-spin" : ""}`} />
            Load from .env
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {SETTINGS_KEYS.map((s) => {
              const isVisible = showValues[s.key];
              return (
                <div key={s.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{s.label}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={s.masked && !isVisible ? "password" : "text"}
                        placeholder={s.placeholder}
                        value={configs[s.key] || ""}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        className="pr-10 font-mono text-sm"
                      />
                      {s.masked && (
                        <button
                          type="button"
                          onClick={() => setShowValues((p) => ({ ...p, [s.key]: !p[s.key] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.key}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Runtime Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SETTINGS_KEYS.map((s) => {
              const val = configs[s.key] || "";
              const isConfigured = val.length > 0;
              return (
                <div key={s.key} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  {isConfigured
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.label}</p>
                    <p className={`text-xs truncate ${isConfigured ? "text-gray-500" : "text-gray-400"}`}>
                      {isConfigured ? (s.masked ? "••••••••" : val) : "Not configured"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
