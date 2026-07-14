import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { Save, Loader2, Building2, Globe2, Phone, RefreshCw, CheckCircle2, XCircle, Bot, Globe, Database, Bell, MessageSquare, Activity, Shield, Mail, User, Lock } from "lucide-react";
import LanguageSelect from "@/components/LanguageSelect";
import { useAuth } from "@/contexts/AuthContext";

const TESTABLE_PROVIDERS = ["openai", "deepgram", "elevenlabs", "twilio"];

const PROVIDER_CONFIG: Record<string, { icon: any; label: string; via: string; fields: { key: string; label: string }[] }> = {
  openai:     { icon: Bot,           label: "AI Conversations",       via: "OpenAI",     fields: [{ key: "OPENAI_API_KEY", label: "API Key" }] },
  deepgram:   { icon: Globe,         label: "Speech Recognition",     via: "Deepgram",   fields: [{ key: "DEEPGRAM_API_KEY", label: "API Key" }] },
  elevenlabs: { icon: Phone,         label: "Text-to-Speech Voice",   via: "ElevenLabs", fields: [{ key: "ELEVENLABS_API_KEY", label: "API Key" }] },
  twilio:     { icon: Phone,         label: "Phone Calls & SMS",      via: "Twilio",     fields: [
    { key: "TWILIO_ACCOUNT_SID", label: "Account SID" },
    { key: "TWILIO_AUTH_TOKEN",  label: "Auth Token" },
    { key: "TWILIO_PHONE_NUMBER", label: "Phone Number" },
  ]},
  aws:        { icon: Database,      label: "Cloud Storage",          via: "AWS S3",     fields: [
    { key: "AWS_ACCESS_KEY_ID",     label: "Access Key ID" },
    { key: "AWS_SECRET_ACCESS_KEY", label: "Secret Access Key" },
    { key: "AWS_REGION",            label: "Region" },
    { key: "AWS_S3_BUCKET",         label: "S3 Bucket" },
  ]},
  acs:        { icon: Mail,          label: "Email Service",          via: "Azure",      fields: [
    { key: "ACS_CONNECTION_STRING", label: "Connection String" },
    { key: "ACS_SENDER_EMAIL",      label: "Sender Email (verified domain)" },
  ]},
  sentry:     { icon: Activity,      label: "Error Monitoring",       via: "Sentry",     fields: [
    { key: "SENTRY_DSN",                label: "DSN" },
    { key: "SENTRY_TRACES_SAMPLE_RATE", label: "Traces Sample Rate (0-1)" },
  ]},
  security:   { icon: Shield,        label: "Security & Encryption",  via: "",           fields: [
    { key: "JWT_EXPIRES_IN",    label: "JWT Expiration (e.g. 7d, 24h)" },
    { key: "PHI_ENCRYPTION_KEY", label: "PHI Encryption Key (64 hex chars)" },
  ]},
  slack:      { icon: Bell,          label: "Notifications",          via: "Slack",      fields: [{ key: "SLACK_WEBHOOK_URL", label: "Webhook URL" }] },
  sms:        { icon: MessageSquare, label: "SMS Alerts",             via: "Twilio",     fields: [{ key: "TWILIO_PHONE_NUMBER", label: "SMS From Number" }] },
  athena:     { icon: Database,      label: "EHR (athenahealth)",    via: "athenahealth", fields: [
    { key: "ATHENA_BASE_URL",    label: "Base URL" },
    { key: "ATHENA_API_KEY",     label: "API Key" },
    { key: "ATHENA_API_SECRET",  label: "API Secret" },
    { key: "ATHENA_PRACTICE_ID", label: "Practice ID" },
  ]},
  fhir:       { icon: Activity,      label: "EHR Integration (FHIR)",  via: "FHIR",       fields: [
    { key: "FHIR_BASE_URL", label: "FHIR Base URL" },
    { key: "FHIR_API_KEY",  label: "API Key (optional)" },
    { key: "FHIR_SYSTEM",   label: "System URL (optional)" },
  ]},
};

export default function ClinicSettings() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["org", "settings"],
    queryFn: () => api.get("/org/settings").then(r => r.data),
  });

  const org = data?.organization;
  const [form, setForm] = useState<any>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyValues, setKeyValues] = useState<Record<string, Record<string, string>>>({});
  const [testResults, setTestResults] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  const profileMutation = useMutation({
    mutationFn: (body: any) => api.put("/auth/profile", body),
    onSuccess: (res: any) => {
      updateUser(res.data.user);
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: (body: any) => api.post("/auth/change-password", body),
    onSuccess: () => {
      toast.success("Password changed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      const payload = { ...body };
      payload.settings = {
        timezone: body.timezone,
        defaultLanguage: body.defaultLanguage,
        websiteUrl: body.websiteUrl,
      };
      return api.put("/org/settings", payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["org", "settings"] });
      if (res?.data?.organization) {
        updateUser({ organization: res.data.organization });
      }
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const { data: providersData } = useQuery({
    queryKey: ["config-status"],
    queryFn: () => api.get("/integrations/providers").then((r) => r.data).catch(() => ({ providers: [] })),
  });

  const providers = providersData?.providers || [];

  useEffect(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const p of providers) {
      const cfg = PROVIDER_CONFIG[p.id as keyof typeof PROVIDER_CONFIG];
      if (cfg) {
        initial[p.id] = {};
        for (const f of cfg.fields) {
          initial[p.id][f.key] = "";
        }
      }
    }
    setKeyValues((prev) => {
      const merged = { ...initial };
      for (const k of Object.keys(prev)) merged[k] = prev[k];
      return merged;
    });
  }, [providers]);

  const configureMutation = useMutation({
    mutationFn: ({ provider, keys }: { provider: string; keys: Record<string, string> }) =>
      api.post("/integrations/configure", { provider, keys }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-status"] });
      toast.success("API keys saved");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
  });

  const scrapeMutation = useMutation({
    mutationFn: (url?: string) =>
      api.post("/integrations/scrape-website", { url }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config-status"] });
      const msg = [
        `Scraped ${data.pagesScraped} pages`,
        data.detectedName ? `Name: ${data.detectedName}` : null,
        data.detectedPhone ? `Phone: ${data.detectedPhone}` : null,
        data.detectedAddress ? `Address: ${data.detectedAddress}` : null,
      ].filter(Boolean).join(" | ");
      toast.success(msg);
      const updated = {
        ...form,
        name: data.detectedName || form.name,
        phone: data.detectedPhone || form.phone,
        address: data.detectedAddress || form.address,
      };
      setForm(updated);
      saveMutation.mutate(updated);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Scrape failed"),
  });

  function handleSaveKeys(providerId: string) {
    const keys = keyValues[providerId];
    if (!keys) return;
    const filled = Object.fromEntries(Object.entries(keys).filter(([, v]) => v.trim()));
    if (Object.keys(filled).length === 0) { toast.error("Enter at least one key"); return; }
    configureMutation.mutate({ provider: providerId, keys: filled });
  }

  async function handleTest(providerId: string) {
    setTestResults((prev) => ({ ...prev, [providerId]: "testing" }));
    try {
      const res = await api.post(`/integrations/test/${providerId}`);
      setTestResults((prev) => ({ ...prev, [providerId]: res.data.ok ? "ok" : "fail" }));
      if (res.data.ok) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch {
      setTestResults((prev) => ({ ...prev, [providerId]: "fail" }));
      toast.error("Test failed");
    }
  }

  const initialized = useRef(false);
  useEffect(() => {
    if (data && !initialized.current) {
      initialized.current = true;
      setForm({
        name: org.name || "",
        brandName: org.brandName || "",
        phone: org.phone || "",
        address: org.address || "",
        websiteUrl: org.settings?.websiteUrl || "",
        timezone: org.settings?.timezone || "America/New_York",
        defaultLanguage: org.settings?.defaultLanguage || "en",
      });
    }
  }, [data]);

  if (isLoading || !form) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Clinic Settings</h1>
        <p className="text-gray-500 text-sm">Manage your clinic profile and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Clinic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <Input value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} placeholder="Override display name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+212XXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Medical Street" />
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <div className="flex gap-2">
              <Input value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://myclinic.com" className="flex-1" />
              <Button type="button" size="sm" variant="outline" disabled={scrapeMutation.isPending || !form.websiteUrl}
                onClick={() => scrapeMutation.mutate(form.websiteUrl)} className="gap-1 shrink-0">
                {scrapeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Scrape & Auto-fill
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Scrapes website to auto-detect clinic name, phone and address</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-1">
              <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Admin Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input value={user?.email || ""} disabled className="bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <Input value={user?.specialty?.join(", ") || ""} disabled className="bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Change Password</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                <Input type="password" placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <Input type="password" placeholder="Min 6 characters"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => passwordMutation.mutate(passwordForm)}
              disabled={passwordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="gap-1">
              {passwordMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
              Update Password
            </Button>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => profileMutation.mutate({ name: form.name, phone: form.phone })}
              disabled={profileMutation.isPending} className="gap-1">
              <Save className="h-4 w-4" /> {profileMutation.isPending ? "Saving..." : "Save Profile Info"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
                <option value="Africa/Casablanca">Africa/Casablanca</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
              <LanguageSelect value={form.defaultLanguage} onChange={v => setForm({ ...form, defaultLanguage: v })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Services</CardTitle>
          <p className="text-sm text-gray-500">Configure and test service credentials. Save first, then click Test to verify.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PROVIDER_CONFIG).map(([id, cfg]) => {
            const Icon = cfg.icon;
            const provider = providers.find((p: any) => p.id === id);
            const connected = provider?.connected;
            const show = showKeys[id];
            const values = keyValues[id] || {};
            const testable = TESTABLE_PROVIDERS.includes(id);
            const testStatus = testResults[id] || "idle";

            return (
              <div key={id} className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{cfg.label}</span>
                    {cfg.via && <span className="text-xs text-gray-400">via {cfg.via}</span>}
                    {testStatus === "ok" && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
                    {testStatus === "fail" && <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Invalid</span>}
                    {testStatus === "idle" && connected != null && (
                      connected
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Connected</span>
                        : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="h-3 w-3" /> Not configured</span>
                    )}
                  </div>
                  <button onClick={() => setShowKeys({ ...showKeys, [id]: !show })} className="text-xs text-primary hover:underline">
                    {show ? "Collapse" : "Configure"}
                  </button>
                </div>
                {show && (
                  <div className="px-4 py-3 space-y-2">
                    {cfg.fields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium text-gray-600 mb-0.5 block">{field.label}</label>
                        <Input type="password"
                          placeholder={`Enter ${field.label}...`}
                          value={values[field.key] || ""}
                          onChange={(e) => setKeyValues({
                            ...keyValues,
                            [id]: { ...values, [field.key]: e.target.value },
                          })}
                          className="h-9 text-sm flex-1 font-mono" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => handleSaveKeys(id)}
                        disabled={configureMutation.isPending} className="gap-1">
                        {configureMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Save Keys
                      </Button>
                      {testable && (
                        <Button size="sm" variant="outline" onClick={() => handleTest(id)}
                          disabled={testStatus === "testing" || !connected} className="gap-1">
                          {testStatus === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                          Test
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
